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

## Update (October 2025)

Railway may execute the `startCommand` without a shell, which means expressions like `0.0.0.0:$PORT` are not expanded and Gunicorn receives the literal string `"$PORT"`. To avoid this, wrap the command in `sh -c` (as in `railway.json`) or keep the Docker `CMD` in shell form. Example:

```
sh -c "exec gunicorn -w ${GUNICORN_WORKERS:-2} --timeout ${GUNICORN_TIMEOUT:-120} -b 0.0.0.0:${PORT:-8080} app_integrated:app"
```

This ensures the `PORT` Railway assigns is expanded correctly even when no default shell is provided by the orchestrator.

### When health checks get in the way

If Railway keeps reporting health-check failures even though the app is running, you can temporarily remove the health check stanza from `railway.json`. Just delete the `healthcheckPath` and `healthcheckTimeout` lines. Railway will then rely on process exit codes instead. Reintroduce the health check once the service is stable so you keep automatic monitoring.
