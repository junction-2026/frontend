## Root cause (brief)
Each blob had `radial-gradient(closest-side, <hex> 45%, transparent)`: a solid core to 45%, then a linear ramp, so all edge softness came from `blur(130px)`. WebKit (Safari) and Chrome on macOS cap the blur radius and downsample it on composited `will-change` layers, more so on Retina (2x), and may clip filter output at the layer bounds. Windows applies the full radius. Hence harder edges on macOS. (Not reproduced on hardware here; inferred from known engine behaviour.)

## Technique
Softness lives in the gradient: stops at 0/20/40/60/80/100% with alpha following a cosine ease (FF, E7, A7, 58, 18, 00), fully transparent at the box edge, no opaque stop past 30%. Blur is lowered to 60px, well under WebKit caps, purely as smoothing against banding. Nothing else changes: no new layers, containment, clip or animated properties.
