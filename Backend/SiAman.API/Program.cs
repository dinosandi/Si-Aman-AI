using SiAman.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using SiAman.Application.Common.Interfaces;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Interfaces.Repository;
using MediatR;
using Microsoft.AspNetCore.Authentication.Cookies;
using SiAman.Infrastructure.Services;
using SiAman.Infrastructure.Repositories;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using SiAman.Application.Common.Behaviours;
using FluentValidation;
using SiAman.API.Middleware;
using SiAman.Application;
using SiAman.API.Hubs;
using Microsoft.AspNetCore.SignalR;


var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddEnvironmentVariables();

builder.Services.AddHttpContextAccessor();

// ── AUTHENTICATION 
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultSignInScheme       = CookieAuthenticationDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"],
        ValidAudience            = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        ClockSkew = TimeSpan.Zero   
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["access_token"];
            if (!string.IsNullOrEmpty(token))
                context.Token = token;
            return Task.CompletedTask;
        },
        OnChallenge = async context =>
        {
            context.HandleResponse();
            context.Response.StatusCode  = 401;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                success    = false,
                message    = "User is not authenticated.",
                statusCode = 401,
                traceId    = context.HttpContext.TraceIdentifier
            });
        },
        OnForbidden = async context =>
        {
            context.Response.StatusCode  = 403;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                success    = false,
                message    = "You do not have permission.",
                statusCode = 403,
                traceId    = context.HttpContext.TraceIdentifier
            });
        }
    };
})
.AddCookie()
.AddGoogle(options =>
{
    var googleAuth = builder.Configuration.GetSection("Authentication:Google");
    options.ClientId     = googleAuth["ClientId"]!;
    options.ClientSecret = googleAuth["ClientSecret"]!;
});

// ── CORS 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// ── CONTROLLERS & SWAGGER 
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();


builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "Si Aman AI API", Version = "v1" });

    options.AddSecurityDefinition("cookieAuth", new()
    {
        Type        = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        In          = Microsoft.OpenApi.Models.ParameterLocation.Cookie,
        Name        = "access_token",
        Description = "JWT disimpan di HttpOnly cookie 'access_token'"
    });

    options.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "cookieAuth" } },
            Array.Empty<string>()
        }
    });
});


// ── DATABASE + POSTGIS 
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.UseNetTopologySuite()  // untuk PostGIS
    )
);

// Daftarkan interface 
builder.Services.AddScoped<IAppDbContext>(sp =>
    sp.GetRequiredService<AppDbContext>());

// ── MEDIATR + VALIDATION 
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(ApplicationAssemblyMarker).Assembly);
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
});

builder.Services.AddValidatorsFromAssembly(
    typeof(ApplicationAssemblyMarker).Assembly);


//
builder.Services.AddHttpClient<IRouteProvider, OsrmRouteProvider>(client =>
{
    client.BaseAddress = new Uri(
        builder.Configuration["Osrm:BaseUrl"] ?? "http://router.project-osrm.org/");
    client.Timeout = TimeSpan.FromMinutes(5);
    client.DefaultRequestHeaders.Add(
        "User-Agent",
        "SiAman/1.0");
});


// WebSockets untuk real-time updates lokasi user
builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();



// ── APPLICATION SERVICES 
builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddScoped<ICookieService, CookieService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

builder.Services.AddScoped<IUserLocationRepository, UserLocationRepository>();

builder.Services.AddScoped<IOsmDataProvider, OsmDataProvider>();

builder.Services.AddScoped<IRoadSafetyRepository, RoadSafetyRepository>();
builder.Services.AddScoped<ISafetyScoreService, SafetyScoreService>();

builder.Services.AddScoped<ISafetyScoreService, SafetyScoreService>();

builder.Services.AddScoped<IIncidentRepository, IncidentRepository>();
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();



var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<LocationHub>("/hubs/location");

app.UseStaticFiles();

app.Run();