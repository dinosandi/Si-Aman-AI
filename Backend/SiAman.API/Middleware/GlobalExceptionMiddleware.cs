using System.Net;
using SiAman.Application.Common.Exceptions;
using FluentValidation;

namespace SiAman.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public GlobalExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(

        HttpContext context,
        Exception exception)
    {

        // traceId untuk melacak error yang terjadi, bisa digunakan untuk debugging
        var traceId = context.TraceIdentifier;
        Console.WriteLine($"Error occurred. TraceId: {traceId}, Exception: {exception}");
        Console.WriteLine($"Message: {exception.Message}");

        var response = context.Response;

        response.ContentType = "application/json";


        // ValidationException harus dicek SEBELUM Exception umum
        if (exception is ValidationException validationEx)
        {
            response.StatusCode = StatusCodes.Status400BadRequest;

            await response.WriteAsJsonAsync(new
            {
                success    = false,
                message    = "Validation failed.",
                errors     = validationEx.Errors.Select(e => e.ErrorMessage).ToList(),
                statusCode = StatusCodes.Status400BadRequest,
                traceId
            });

            return;
        }

        var statusCode = exception switch
        {
            UnauthorizedAccessException =>
                StatusCodes.Status401Unauthorized,

            NotFoundException =>
                StatusCodes.Status404NotFound,

            BadRequestException =>
                StatusCodes.Status400BadRequest,

            ArgumentException =>
                StatusCodes.Status400BadRequest,

            _ =>
                StatusCodes.Status500InternalServerError
        };

        response.StatusCode = statusCode;

        var result = new
        {
            success = false,
            message = exception.Message,
            statusCode,
            traceId = context.TraceIdentifier
        };

        await response.WriteAsJsonAsync(result);
    }
}