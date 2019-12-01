---
title: Sgen to precompile classes for XmlSerializer
date: 2014-05-21
tags: [".NET","ASP.NET","C#","Debugging","MSBuild","Performance","Sgen","XmlSerializer"]
description: During my investigation of our ASP.NET application performance issue, I've found out that XmlSerializer may require a long warm-up. The first time, when it's used for a specific class (de-)serialization, can take up to 500 ms om my machine! We use XmlSerializer to encode/decode user preferences. Having 40 different classes being deserialized at user login lead to a massive delay of 14 seconds.
---

During my investigation of our ASP.NET application performance issue, I've found out that XmlSerializer may require a long warm-up. The first time, when it's used for a specific class (de-)serialization, can take up to 500 ms om my machine! We use XmlSerializer to encode/decode user preferences. Having 40 different classes being deserialized at user login lead to a massive delay of 14 seconds. This is only for the first user login after the application start-up, but you do quite a lot of 'first times' every day while developing the application.

These delays are caused by the runtime which prepares and compiles the strongly typed classes for serialization in runtime. Not sure why it's SO slow, but probably things might go wrong.

There is a simple solution for this problem: create those helper classes at build time, pack it into an assembly and ship it as part of your .NET application. The tool that does this is called Sgen.exe, and it is a part of .NET SDK. So, we just need to use it in our project.

The easiest way is to add a post-build event in your CS project properties. The event would look like
<pre>sgen.exe /force /assembly:"$(TargetPath)"</pre>
After re-compiling the project, you should see a new assembly in Bin directory, which has the name ending with XmlSerializers.dll. That's the new assembly which will save you several seconds on each application start-up. It will be automatically copied to Bin directory of the projects which reference the original assembly with your serializable classes, so no other actions needed.

However, this command might fail. Sgen tool will try to prepare the helper classes for each class in your assembly, which might not be possible. Then you'll get some error messages in Visual Studio. In this case, you might want to add a "/types" parameter, explicitly listing the class names to precompile. But I have a better solution for you.

It's quite possible that you use MSBuild for regular automated builds of your project. We do. In this case a post-build event in the project properties won't work during those build. Then, do not add any post-build events, but instead open your .csproj file in plain text editor, and search for the following commented section:

    <!-- To modify your build process, add your task inside one of the targets below and uncomment it.
       Other similar extension points exist, see Microsoft.Common.targets.
    <Target Name="BeforeBuild">
    </Target>
    <Target Name="AfterBuild">
    </Target>
    -->

Uncomment the second XML node and substitute it with something like this:

    <Target Name="AfterBuild" DependsOnTargets="AssignTargetPaths;Compile;ResolveKeySource" Inputs="$(MSBuildAllProjects);@(IntermediateAssembly)" Outputs="$(OutputPath)$(_SGenDllName)">
        <ItemGroup>
          <SgenTypes Include="MyNamespace.MySerializableClass1" />
          <SgenTypes Include="MyNamespace.MySerializableClass2" />
          <SgenTypes Include="MyNamespace.MySerializableClassN" />
        </ItemGroup>
        <Delete Files="$(TargetDir)$(TargetName).XmlSerializers.dll" ContinueOnError="true" />
        <SGen BuildAssemblyName="$(TargetFileName)" BuildAssemblyPath="$(OutputPath)" References="@(ReferencePath)" ShouldGenerateSerializer="true" UseProxyTypes="false" KeyContainer="$(KeyContainerName)" KeyFile="$(KeyOriginatorFile)" DelaySign="$(DelaySign)" ToolPath="$(SGenToolPath)" Types="@(SgenTypes)">
          <Output TaskParameter="SerializationAssembly" ItemName="SerializationAssembly" />
        </SGen>
    </Target>

The ItemGroup lists all the classes that you need to precompile. You can omit this section and Types attribute of SGen node if you want to compile all classes in assembly.
Have a nice application start-up boost!