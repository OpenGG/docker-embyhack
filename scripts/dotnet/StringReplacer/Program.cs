// =======================================================================
// PROJECT: StringReplacer
// =======================================================================
// File: StringReplacer/Program.cs
// Purpose: This tool reads an assembly, finds strings matching a regex in
//          both IL and embedded JS files, performs a regex-based replacement,
//          and saves a new, patched assembly. This version is refactored for
//          maintainability and uses System.CommandLine for robust argument parsing.
//
// Project Setup:
// 1. Create a directory: `mkdir StringReplacer` and `cd StringReplacer`
// 2. Create a project: `dotnet new console`
// 3. Add required packages:
//    `dotnet add package Mono.Cecil`
//    `dotnet add package System.CommandLine`
// 4. Replace the contents of `StringReplacer/Program.cs` with the code below.
// =======================================================================
namespace StringReplacer;

using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.CommandLine;
using Mono.Cecil;
using Mono.Cecil.Cil;
using System;
using System.Linq;

public class StringReplacer
{
    // Main entry point now uses the modern System.CommandLine API.
    public static int Main(string[] args)
    {
        Argument<FileInfo> fileArgument = new("assembly-path")
        {
            Description = "The path to the .NET assembly DLL to modify."
        };

        Option<string> matchOption = new("--match-pattern")
        {
            Description = "The initial regex pattern to identify candidate strings or files for replacement.",
            Required = true
        };

        Option<string> replaceRegexOption = new("--replace-regex")
        {
            Description = "The regex pattern to use for finding content to replace within matched strings.",
            Required = true
        };

        Option<string> replaceContentOption = new("--replace-content")
        {
            Description = "The replacement string. Can use capture groups like $1.",
            Required = true
        };

        Option<string> resolveDirOption = new("--resolve-dir")
        {
            Description = "The resolve dir string.",
            Required = false
        };

        RootCommand rootCommand = new("Finds and replaces strings in .NET assembly IL and embedded JS resources.");
        rootCommand.Arguments.Add(fileArgument);
        rootCommand.Options.Add(matchOption);
        rootCommand.Options.Add(replaceRegexOption);
        rootCommand.Options.Add(replaceContentOption);
        rootCommand.Options.Add(resolveDirOption);

        rootCommand.SetAction((parsedResult) =>
            RunPatcher(parsedResult.GetValue(fileArgument)!, parsedResult.GetValue(matchOption)!, parsedResult.GetValue(replaceRegexOption)!, parsedResult.GetValue(replaceContentOption)!, parsedResult.GetValue(resolveDirOption)!)
        );

        return rootCommand.Parse(args).Invoke();
    }

    // The core logic of the application, now separate from argument parsing.
    private static int RunPatcher(FileInfo assemblyPath, string matchPattern, string replaceRegex, string replaceContent, string resolveDir)
    {
        if (!assemblyPath.Exists)
        {
            Console.WriteLine($"Error: Input file not found at '{assemblyPath.FullName}'");
            throw new FileNotFoundException("Input file not found.", assemblyPath.FullName);
        }

        string patchedAssemblyPath = Path.ChangeExtension(assemblyPath.FullName, ".patched.dll");

        Console.WriteLine($"Loading assembly: {assemblyPath.FullName}");
        Console.WriteLine($"Finding strings matching regex: '{matchPattern}'");
        Console.WriteLine($"Replacing content using regex '{replaceRegex}' with '{replaceContent}'.");

        try
        {
            var resolver = new DefaultAssemblyResolver();
            resolver.AddSearchDirectory(string.IsNullOrEmpty(resolveDir) ? assemblyPath.DirectoryName ?? "." : resolveDir);
            var readerParameters = new ReaderParameters { ReadSymbols = false, AssemblyResolver = resolver };
            var writerParameters = new WriterParameters { WriteSymbols = false };


            using var assembly = AssemblyDefinition.ReadAssembly(assemblyPath.FullName, readerParameters);

            int ilReplacementCount = PatchIlStrings(assembly, matchPattern, replaceRegex, replaceContent);
            int resourceReplacementCount = PatchEmbeddedResources(assembly, matchPattern, replaceRegex, replaceContent);
            int literalFieldReplacementCount = PatchLiteralStringFields(assembly, matchPattern, replaceRegex, replaceContent);

            int totalReplacements = ilReplacementCount + resourceReplacementCount + literalFieldReplacementCount;
            if (totalReplacements > 0)
            {
                Console.WriteLine($"\nFound and replaced {ilReplacementCount} IL string(s) and modified {resourceReplacementCount} resource(s).");
                Console.WriteLine($"Saving patched assembly to: {patchedAssemblyPath}");
                assembly.Write(patchedAssemblyPath, writerParameters);
            }
            else
            {
                Console.WriteLine("\nNo matching strings or resources found to replace.");
            }
            return 0;
        }
        catch (BadImageFormatException)
        {
            Console.WriteLine($"Error: The file '{assemblyPath.FullName}' is not a valid .NET assembly.");
            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"An unexpected error occurred: {ex.Message}");
            throw;
        }
    }

    // Handles the modification of IL instructions.
    private static int PatchIlStrings(AssemblyDefinition assembly, string matchPattern, string replaceRegex, string replaceContent)
    {
        Console.WriteLine("\nScanning IL instructions...");
        int replacementCount = 0;
        foreach (var module in assembly.Modules)
        {
            foreach (var type in module.GetTypes())
            {
                foreach (var method in type.Methods.Where(m => m.HasBody))
                {
                    var ilProcessor = method.Body.GetILProcessor();
                    for (int i = method.Body.Instructions.Count - 1; i >= 0; i--)
                    {
                        var instruction = method.Body.Instructions[i];
                        if (instruction.OpCode != OpCodes.Ldstr) continue;

                        string originalString = (string)instruction.Operand;
                        Console.WriteLine($"  - Checking IL string: '{originalString}'");
                        (bool replaced, string newString) = PerformReplacement(originalString, matchPattern, replaceRegex, replaceContent);
                        if (replaced)
                        {
                            var newInstruction = ilProcessor.Create(OpCodes.Ldstr, newString);
                            ilProcessor.Replace(instruction, newInstruction);
                            Console.WriteLine($"  - Replaced in '{method.Name}': '{originalString}' -> '{newString}'");
                            replacementCount++;
                        }
                    }
                }
            }
        }
        return replacementCount;
    }

    // Handles the modification of embedded resources.
    private static int PatchEmbeddedResources(AssemblyDefinition assembly, string matchPattern, string replaceRegex, string replaceContent)
    {
        Console.WriteLine("\nScanning embedded resources...");
        int replacementCount = 0;
        var resourcesToModify = assembly.MainModule.Resources.OfType<EmbeddedResource>().ToList();

        foreach (var resource in resourcesToModify)
        {
            if (!resource.Name.EndsWith(".js", StringComparison.OrdinalIgnoreCase)) continue;

            Console.WriteLine($"  - Checking JS resource: {resource.Name}");
            string originalContent;
            using (var reader = new StreamReader(resource.GetResourceStream(), Encoding.UTF8))
            {
                originalContent = reader.ReadToEnd();
            }

            (bool replaced, string newContent) = PerformReplacement(originalContent, matchPattern, replaceRegex, replaceContent);

            if (replaced)
            {
                Console.WriteLine($"    - Content modified. Replacing resource.");
                var newResource = new EmbeddedResource(resource.Name, resource.Attributes, Encoding.UTF8.GetBytes(newContent));
                assembly.MainModule.Resources[assembly.MainModule.Resources.IndexOf(resource)] = newResource;
                replacementCount++;
            }
        }
        return replacementCount;
    }

    // In your StringReplacer class (e.g., after PatchEmbeddedResources)
    private static int PatchLiteralStringFields(AssemblyDefinition assembly, string matchPattern, string replaceRegex, string replaceContent)
    {
        Console.WriteLine("\nScanning static literal string fields...");
        int replacementCount = 0;
        foreach (var module in assembly.Modules)
        {
            foreach (var type in module.GetTypes())
            {
                foreach (var field in type.Fields)
                {
                    if (field.IsLiteral && field.IsStatic && field.Constant is string originalConstantString)
                    {
                        Console.WriteLine($"  - Checking literal field '{field.FullName}': '{originalConstantString}'");
                        (bool replaced, string newString) = PerformReplacement(originalConstantString, matchPattern, replaceRegex, replaceContent);
                        if (replaced)
                        {
                            field.Constant = newString; // <--- This is the key line to modify the constant value!
                            Console.WriteLine($"  - Replaced literal field '{field.FullName}': '{originalConstantString}' -> '{newString}'");
                            replacementCount++;
                        }
                    }
                }
            }
        }
        return replacementCount;
    }

    // BUG FIX: This logic now uses a MatchEvaluator. It finds all occurrences
    // matching `matchPattern` and then runs the `replaceRegex` ONLY on the
    // content of those matches. This prevents unintended side-effects.
    private static (bool, string) PerformReplacement(string input, string matchPattern, string replaceRegex, string replaceContent)
    {
        bool wasReplaced = false;

        string newString = Regex.Replace(input, matchPattern, match =>
        {
            // 'match.Value' is the specific substring that matched the `matchPattern`.
            // Now, we apply the more granular `replaceRegex` only to this segment.
            string replacedSegment = Regex.Replace(match.Value, replaceRegex, replaceContent);

            // Track if any actual change occurred.
            if (match.Value != replacedSegment)
            {
                wasReplaced = true;
            }

            return replacedSegment;
        });

        return (wasReplaced, newString);
    }
}
