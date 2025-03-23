# Quote API

## Endpoint
> `POST /api/submit-quote`

## REQ Body
```ts
type InputSchema = {
    name: string;
    company?: string;
    line_one: string;
    postcode: string;
    city: string;
    email: string;
    phone: string;
    property_rooms: number;
    property_type: string;
    property_features?: string[];
    request: JobRequestTypes;
};
```
	
## Returns
```json
	OK = 200: {
        "status": "ok",
        "message": "Quote created successfully",
        "jobId": "NWGC25-JOB-0005",
        "customerId": 1,
        "siteAddressId": 4,
        "billingAddressId": 2
    }
	Bad key = 401: {
        "status": "fail",
        "message": "Bad or missing API key in header/query"
	}
	Bad JSON = 400: {
        "status": "error",
        "message": "Invalid JSON syntax",
        "location": "Expected ',' or '}' after property value in JSON at position 145 (line 7 column 3)"
	}
	Missing Data = 500: {
        "type": "error",
        "reason": "validation",
        "message": "Field 'postcode' must be a string"
    }
    Too many requests = 429: {
        "status": "error",
        "message": "Too many requests, wait before trying again."
    }
```
