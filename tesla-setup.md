# Tesla Fleet API Setup Configuration

## Tesla API Dashboard Configuration

### Domain and URLs
**Primary Domain:** `www.voltracker.com`

### Required Settings:

**Allowed Origin(s):**
```
https://www.voltracker.com
https://voltracker.com
```

**Allowed Redirect URI(s):**
```
https://www.voltracker.com/auth/tesla/callback
```

**Allowed Returned URL(s):**
```
https://www.voltracker.com/auth/tesla/callback
```

### Public Key Location
The public key must be accessible at:
```
https://www.voltracker.com/.well-known/appspecific/com.tesla.3p.public-key.pem
```

**Public Key Content:**
```
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIdyAOvqhJRUJ9GxLe+gnM7kRDyqI
gz/QdGH8f8lCoKm8hQsQoO2Exum3hieGGomIF3Skh/mpOROUMH45cnzqiA==
-----END PUBLIC KEY-----
```

## Next Steps

1. **Upload public key** to your domain at the well-known path
2. **Configure Tesla API Dashboard** with the URLs above
3. **Run the registration script** (see register-tesla-api.js)
4. **Test the OAuth flow** on your live domain

## Files Generated
- `private-key.pem` - Keep this SECRET, never commit to git
- `public-key.pem` - This goes on your domain  
- `public/.well-known/appspecific/com.tesla.3p.public-key.pem` - Ready for web hosting

## Domain Verification
Tesla will verify domain ownership by checking:
`https://www.voltracker.com/.well-known/appspecific/com.tesla.3p.public-key.pem`

Make sure this file is accessible and returns the exact public key content above.