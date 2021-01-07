## A Fault-Tolerance Shim for Serverless Computing

https://www.vikrams.io/papers/aft-eurosys20.pdf

They built an atomic-write storage to avoid dirty reads when a function writes multiple pieces and fails in the middle. The rest guarantees is quite loose.