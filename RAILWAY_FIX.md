# Railway Deployment Fix

## Issue
Your app is failing health checks because it's using `app.run()` with a hardcoded port (5001) instead of using the `$PORT` environment variable that Railway provides.

## Solution
Replace the last line in `app_integrated.py`:

**OLD:**
```python
    app.run(debug=True, host='0.0.0.0', port=5001, use_reloader=False)
```

**NEW:**
```python
    # Run the app (only for local development - use Gunicorn in production)
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=False, host='0.0.0.0', port=port, use_reloader=False)
```

## Why This Fixes It
- Railway sets the `PORT` environment variable dynamically
- Your app must bind to this port for Railway's health check to work
- Gunicorn (in your Procfile) automatically uses `$PORT`, but when running directly with `app.run()`, you need to read it from the environment

## Apply the Fix Manually
1. Open `backend/app_integrated.py`
2. Go to the last line (line 1616)
3. Replace as shown above
4. Commit and push
5. Redeploy on Railway

## Alternative (Better for Production)
Since you're using Gunicorn in your Procfile, you don't need the `if __name__ == '__main__'` block to run in production. Gunicorn will import your app directly and run it.

The fix above ensures it works in both cases.
