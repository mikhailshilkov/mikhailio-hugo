---
title: Hunting memory leaks in Silverlight
date: 2012-02-05
tags: ["C#","fixing memory leaks","Memory leaks","Silverlight","WinDbg"]
description: Recently, I've spent a couple of days seeking and fixing memory leaks in our Silverlight application. It might be tough sometimes, but it's a good 'brain-teasing' practice and it's a good way to learn how inner things work.
---

Recently, I've spent a couple of days seeking and fixing memory leaks in our Silverlight application. It might be tough sometimes, but it's a good 'brain-teasing' practice and it's a good way to learn how inner things work.

Memory leaks in Silverlight applications may be found with WinDbg tool. Have a look here for a quick introduction:
[http://davybrion.com/blog/2009/08/finding-memory-leaks-in-silverlight-with-windbg/](http://davybrion.com/blog/2009/08/finding-memory-leaks-in-silverlight-with-windbg/)

Basically, I only use 4 commands in WinDbg. First, I enable debugging Silverlight 5 applications:

    !load C:\Program Files (x86)\Microsoft Silverlight\5.0.61118.0\sos.dll

Then, I get the amount of instances for class names matching the search pattern:

    !dumpheap -stat -type <type name>

Next, I use the result to locate class instances' addresses:

    !dumpheap -MT <MT from previous>

Finally, I get the reference chain for each of address found:

    !gcroot <address>

Having done this, you'll have to turn your brain on and try to figure out whether you found a memory leak and why if yes, why it takes place. Here are several examples of memory leaks that I found during last session:
1. HtmlPage.Document.AttachEvent() call, which was never detached. We were using some browser-level API to subscribe on HTML document events, and never cared about unsubscribing. I got it refactored to native Silverlight event handlers, and this solved the issue.
2. Deriving from MultiScaleTileSource. We used to have several classes for map layer rendering, inherited from MultiScaleTileSource. If an instance of such class is never used for map rendering (no assignment to MultiScaleImage.Source), then the GC never collects it (together with everything it references, of course). Another portion of refactoring helped: do not derive from MultiScaleTileSource whenever it's not needed for MultiScaleImage population. Sounds trivial, right? But it helps a lot.
3. Improper usage of CompositionTarget.Rendering event. For our custom animated Progress control, we used to subscribe to CompositionTarget.Rendering in control constructor, and then animated the progress in event handler. As the Progress control used to be a part of control tree (in Expanded/Collapsed state), the event was never unsubsribed, which means... ta-dam... a memory leak. Now I use CompositionTarget.Rendering more carefully: subscribe to it at the point when Progress control is shown, and unsubscribe immediately after it gets collapsed.
4. One of our major controls used to fail to unsubscribe itself from global error handler. There were a couple other similar event-related leaks. All fixed.
5. A weird Telerik-related leak. We actively use RadGridView control throughout our application, and we dynamically set HeaderCellStyle for some of the columns depending on grid configuration. Unexpectedly enough, this led to a memory leak with the following reference stack:

    HandleTable:
        02f311f4 (pinned handle)
        -> 11ee6210 System.Object[]
        -> 10f21690 OurNamespace.Utilities.AppletHelper
        -> 10f21670 System.EventHandler`1[[OurNamespace.Utilities.EventArgs`1[[System.Exception, mscorlib]], OurNamespace.Utilities]]
        -> 10f2103c QFVClient.App
        -> 1111a9bc QFVClient.PageContainer
        -> 11122138 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 11122184 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 1188ba6c System.Windows.Controls.Grid
        -> 1188bad4 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 118912d8 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 11122dc8 System.Windows.Controls.Border
        -> 11122e30 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 11122e7c System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 11128ea4 System.Windows.Controls.Grid
        -> 11128f0c System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 11128f58 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 11128fa4 System.Windows.Controls.Border
        -> 1112900c System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 11129058 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 11132e00 System.Windows.Controls.Grid
        -> 11132e68 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 11135bc4 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 11133758 QFVClient.Controls.SearchBox
        -> 11133ca8 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 11133cf4 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 11133c40 System.Windows.ResourceDictionary
        -> 11133d30 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 11133d7c System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 11133e18 System.Windows.Style
        -> 11133e68 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 11133eb4 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 11133ef0 System.Collections.Generic.Dictionary`2[[System.UInt32, mscorlib],[System.Windows.DependencyObject, System.Windows]]
        -> 11133f3c System.Collections.Generic.Dictionary`2+Entry[[System.UInt32, mscorlib],[System.Windows.DependencyObject, System.Windows]][]
        -> 110dced0 System.Windows.Style
        -> 110dcf20 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 110dcf6c System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 110dce6c System.Windows.SetterBaseCollection
        -> 110dcfa8 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 110dcff4 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 110dcd0c System.Windows.Setter
        -> 110dcd5c System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 110dcda8 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 110dcde4 System.Collections.Generic.Dictionary`2[[System.UInt32, mscorlib],[System.Windows.DependencyObject, System.Windows]]
        -> 110dce30 System.Collections.Generic.Dictionary`2+Entry[[System.UInt32, mscorlib],[System.Windows.DependencyObject, System.Windows]][]
        -> 110dcad0 System.Windows.Controls.ControlTemplate
        -> 110dcb34 System.Windows.ResourceDictionary
        -> 110dd0d8 MS.Internal.ResourceDictionaryCollection
        -> 110dd21c System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 1111609c System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 110df418 System.Windows.ResourceDictionary
        -> 110df470 System.Collections.Generic.Dictionary`2[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]]
        -> 110eb8b4 System.Collections.Generic.Dictionary`2+Entry[[MS.Internal.IManagedPeerBase, System.Windows],[System.Object, mscorlib]][]
        -> 110ecde0 System.Windows.Style
        -> 116d1cd4 OurNamespace.Controls.TextColumn

PageContainer is the application container which always exists, while TextColumn is a custom column class for a Telerik grid, which is already removed from application tree at the time point. Our TextColumn gets bound with root controls through ResourceDictionary/Style chain; and I can't explain the reason of such a leak. Though, clearing HeaderCellStyle when grid is not needed anymore does fix the problem. Weird enough.

As you can see, there are numerous reasons for memory leaks in a Silverlight application. Some are obvious (e.g. global event handlers never unsubscribed), other ones are hard to understand intuitively and sometimes depend on runtime or third party internals. In any case, a way to fix or workaround always exists. Good luck with bug hunting!