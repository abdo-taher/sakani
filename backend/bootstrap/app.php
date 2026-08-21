<?php

use Illuminate\Foundation\Application;
    use Illuminate\Foundation\Configuration\Exceptions;
    use Illuminate\Foundation\Configuration\Middleware;
    use Illuminate\Http\Request;
    use App\Http\Middleware\AdminMiddleware;
    use App\Http\Middleware\SanitizeInput;
    use App\Http\Middleware\ValidateFileUploads;
    use App\Http\Middleware\CorsMiddleware;
    use App\Http\Middleware\TrackVisitor;

    return Application::configure(basePath: dirname(__DIR__))
        ->withRouting(
            web: __DIR__.'/../routes/web.php',
            api: __DIR__.'/../routes/api.php',
            commands: __DIR__.'/../routes/console.php',
            health: '/up',
        )
        ->withMiddleware(function (Middleware $middleware): void {

    $middleware->redirectGuestsTo(fn () => null);

    $middleware->alias([
        'admin' => AdminMiddleware::class,
        'sanitize' => SanitizeInput::class,
        'validate.files' => ValidateFileUploads::class,
        'cors' => CorsMiddleware::class,
    ]);

    // Apply CORS to API routes
    $middleware->api(prepend: [
        CorsMiddleware::class,
    ]);

    // Apply input sanitization to all requests
    $middleware->web(append: [
        SanitizeInput::class,
    ]);

    $middleware->api(append: [
        SanitizeInput::class,
        TrackVisitor::class,
    ]);

})
        ->withExceptions(function (Exceptions $exceptions): void {
            $exceptions->shouldRenderJsonWhen(
                fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
            );

            $exceptions->renderable(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
                if ($request->is('api/*') || $request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthenticated'
                    ], 401);
                }
            });

            $exceptions->renderable(function (\Illuminate\Database\Eloquent\ModelNotFoundException $e, Request $request) {
                if ($request->is('api/*')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'العنصر غير موجود'
                    ], 404);
                }
            });
        })->create();
