// =======================================================================
// PROJECT: TestApp
// =======================================================================
// To compile the TestApp with an embedded resource:
// 1. Create a directory: `mkdir TestApp` and `cd TestApp`
// 2. Run `dotnet new console` to generate the project files.
// 3. Replace the content of `Program.cs` with the code above.
// 4. Create a JS file: `mkdir scripts` and create `scripts/api.js`
//    with the content: `const API_URL = "http://a.com/products/abc/details";`
// 5. Edit `TestApp.csproj` and add the <ItemGroup> for EmbeddedResource:
/*
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <EmbeddedResource Include="scripts\api.js" />
  </ItemGroup>
</Project>
*/
// 6. Run: `dotnet build`
// This produces `TestApp/bin/Debug/net8.0/TestApp.dll`

namespace TestApp;

using System;

public class Program
{
    public static void Main()
    {
        // We will target this IL string for replacement.
        Console.WriteLine("match: https://a.com/users/123/profile");
        Console.WriteLine("match: https://a.com/system/info/long/url/long/enough/to/trigger/linebreak/in/ildasm");
        Console.WriteLine("no match: https://www.a.com/system/info");
        Console.WriteLine("no match: https://a.com/topics/23345/details");

        // This string will not match our pattern and should remain unchanged.
        Console.WriteLine("This is a regular message.");
    }
}
