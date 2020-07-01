## Using Application Knowledge to Reduce Cold Starts in FaaS Services

https://dlnext.acm.org/doi/pdf/10.1145/3341105.3373909

Idea: if we have 4 serverless functions that are chained together (called in sequence), we can do tricks to prewarm functions 2 to 4 when function 1 is called. They discuss several approaches and share some experimental results.

Not very compelling.