import express, { NextFunction, Request, Response, Router } from "express";
import cors from "cors"
import { startDB } from "./db";
import path from "path";
import { isDev } from "./dev"
import cookieParser from "cookie-parser";
import { mailRouter } from "./comms/email";

async function main(){
  const  apiSchema = await startDB()

  const app = express();

  app.use(express.json({
    strict: true,
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf.toString());
      } catch (err) {
        const error = new Error(err as any);//`Invalid JSON at line ${(err as any)?.lineNumber || 'unknown'}`);
        (error as any).status = 400;
        throw error;
      }
    }
  }));
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
        status: err.status || 500,
      },
    });
    next()
  });

  app.set('trust proxy',['loopback', 'linklocal', 'uniquelocal'])
  app.use(cors())
  app.use(cookieParser())
  app.use(apiSchema)
  app.use(mailRouter)

  app.use((req,res,next)=>{
    const logs = {
      method: req.method,
      url:req.originalUrl,
      host:req.headers.host,
      forwarded:req.headers['x-forwarded-for'],
      ip: req.ip
    }
    if(req.url !== '/api/health')
    console.log(`[${new Date()}]`,logs)
    next()
  })
  
  // websocketMiddleware(server)

  app.post('/api/health',(req,res)=>{
    res.send({
      status:'ok',
      message:'Server Running'
    })
  })

  app.get('/echo',(req,res)=>{
    res.send({
      status:'ok',
      echo: JSON.stringify(req.body)
    })
  })

  // if(!isDev()){
    app.use(express.static(path.join(__dirname, "public")));

    app.get("*", (req, res, next) => {
      // If the request is for a file (has a dot), skip to next middleware (will 404 if not found)
      if (req.path.includes(".")) return next();
      res.sendFile(path.join(__dirname, "public", "index.html"));
    });
  // }
  const port = process.env.PORT || process.env.PROD_PORT || 3002;
  const server = app.listen(port, async ()=>{
    console.log(`ready on port ${port}`)
  })
}

main()