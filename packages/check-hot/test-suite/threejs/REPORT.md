# Three.js check-hot report

## Verdict

- Package root: `three@0.185.1`, 1179 files, 21354 function candidates, 97065 static risk hypotheses, 16538 runtime obligations.
- Root coverage is **incomplete**, not failed Three.js code: 6 dynamic/CDN graph boundaries require explicit environments.
- Measured target: `MathUtils.lerp` on `node@26.7.0/v8@14.6.202.34-node.28`.
- Runtime result: **PASS**; 4 selected obligations passed with exact guarded-site evidence, 0 target deoptimizations.

No change to `lerp` is justified by this run: it remained in turbofan, preserved semantics, and accepted three distinct numeric representations. The report deliberately does not blame helper/verifier deoptimizations on Three.js.

## Measured numeric domain

- Accepted variants: `seed-number`, `fractional-double`, `negative-zero`.
- Observed representations: `heap-number`, `smi`, `negative-zero`.
- Semantic sample: `lerp:math-utils-lerp`.

Excluded inputs do not count as tested evidence:

- `nan`: the generated numeric input is outside this MathUtils recipe's documented domain
- `int32-overflow`: the generated numeric input is outside this MathUtils recipe's documented domain
- `uint32-overflow`: the generated numeric input is outside this MathUtils recipe's documented domain

## Prioritized follow-up experiments

These are AST-ranked hypotheses, not confirmed performance defects. Run a representative renderer/loader workload before changing source.

1. `src/materials/Material.js#Material.fromJSON@896:29119` (src/materials/Material.js:896, score 3389)
    - **parameter-property-access** (static-hypothesis): A function parameter is used as a named-property receiver, so hidden-class and missing-field diversity are hot-path inputs.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
    - **late-instance-property-write** (static-hypothesis): A method writes an instance property outside the constructor; the first write may transition the receiver shape.
      Likely cause: Fields or prototypes change after objects have already trained optimized code.
      Confirm: Compare object maps and prototype state across setup, warmup, and guarded stress.
      Possible action: Initialize fields in a consistent order and complete structural changes before warmup. (Map or deoptimization evidence links the late mutation to the hot workload.)
    - **parameter-indexed-access** (static-hypothesis): A function parameter is used as an indexed/array-like receiver, so elements kind and packedness are hot-path inputs.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
2. `src/loaders/ObjectLoader.js#ObjectLoader.parseObject@776:18437` (src/loaders/ObjectLoader.js:776, score 2026)
    - **dynamic-keyed-access-in-loop** (static-hypothesis): A loop performs keyed access with a dynamic key; changing key/value shapes can make its inline cache polymorphic or megamorphic.
      Likely cause: One keyed access observes string, numeric-index, symbol, or receiver-map diversity.
      Confirm: Run string, index, and symbol variants accepted by the API and inspect keyed inline-cache transitions.
      Possible action: Separate key families or normalize keys at the API boundary. (Deep engine evidence confirms a harmful polymorphic or megamorphic keyed access.)
    - **parameter-property-access** (static-hypothesis): A function parameter is used as a named-property receiver, so hidden-class and missing-field diversity are hot-path inputs.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
    - **ambiguous-keyed-receiver** (static-hypothesis): A function parameter is used as a dynamically keyed receiver, but the access does not prove whether it is an array, string, object, or collection-like value.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
3. `src/extras/TextureUtils.js#getByteLength@100:3532` (src/extras/TextureUtils.js:100, score 585)
    - **numeric-operation** (static-hypothesis): A function parameter reaches a numeric representation-sensitive operation.
      Likely cause: A numeric operation observes values that move between SMI, heap-number, boundary, or exceptional numeric representations.
      Confirm: Exercise SMI, fractional, -0, NaN, integer boundaries, and overflow variants with semantic verification.
      Possible action: Normalize the accepted numeric domain or warm every intentional representation. (Engine evidence confirms a harmful representation transition and normalization preserves the API contract.)
    - **large-complex-function** (static-hypothesis): The function spans 102 lines and has 44 branch nodes, making tiering and scenario coverage harder to reason about.
      Likely cause: A large function or dense branch graph increases compilation and coverage complexity.
      Confirm: Use CPU hotness evidence and isolated branch scenarios before attributing a runtime cost to size alone.
      Possible action: Split independently hot branch families into smaller functions. (Runtime evidence shows compilation, inlining, or coverage pressure and the split preserves semantics.)
4. `src/materials/ShaderMaterial.js#ShaderMaterial.fromJSON@413:10441` (src/materials/ShaderMaterial.js:413, score 399)
    - **allocation-in-loop** (static-hypothesis): 7 allocation-shaped expression(s) occur inside loops.
      Likely cause: Repeated allocation or exceptional/asynchronous control flow occurs inside a loop.
      Confirm: Run a representative large-input scenario and inspect allocation, GC, and branch-specific runtime evidence.
      Possible action: Hoist reusable state or separate exceptional/asynchronous work from the synchronous loop. (Profiling confirms the reported operation dominates the real hot workload.)
    - **parameter-property-access** (static-hypothesis): A function parameter is used as a named-property receiver, so hidden-class and missing-field diversity are hot-path inputs.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
    - **dynamic-keyed-access-in-loop** (static-hypothesis): A loop performs keyed access with a dynamic key; changing key/value shapes can make its inline cache polymorphic or megamorphic.
      Likely cause: One keyed access observes string, numeric-index, symbol, or receiver-map diversity.
      Confirm: Run string, index, and symbol variants accepted by the API and inspect keyed inline-cache transitions.
      Possible action: Separate key families or normalize keys at the API boundary. (Deep engine evidence confirms a harmful polymorphic or megamorphic keyed access.)
5. `src/materials/Material.js#Material.copy@1096:40078` (src/materials/Material.js:1096, score 520)
    - **late-instance-property-write** (static-hypothesis): A method writes an instance property outside the constructor; the first write may transition the receiver shape.
      Likely cause: Fields or prototypes change after objects have already trained optimized code.
      Confirm: Compare object maps and prototype state across setup, warmup, and guarded stress.
      Possible action: Initialize fields in a consistent order and complete structural changes before warmup. (Map or deoptimization evidence links the late mutation to the hot workload.)
    - **parameter-property-access** (static-hypothesis): A function parameter is used as a named-property receiver, so hidden-class and missing-field diversity are hot-path inputs.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
    - **dynamic-keyed-access-in-loop** (static-hypothesis): A loop performs keyed access with a dynamic key; changing key/value shapes can make its inline cache polymorphic or megamorphic.
      Likely cause: One keyed access observes string, numeric-index, symbol, or receiver-map diversity.
      Confirm: Run string, index, and symbol variants accepted by the API and inspect keyed inline-cache transitions.
      Possible action: Separate key families or normalize keys at the API boundary. (Deep engine evidence confirms a harmful polymorphic or megamorphic keyed access.)
6. `src/materials/nodes/manager/NodeMaterialObserver.js#NodeMaterialObserver.equals@374:7958` (src/materials/nodes/manager/NodeMaterialObserver.js:374, score 453)
    - **delete-property** (static-hypothesis): Deleting an object property can move objects to dictionary storage and invalidate optimized shape assumptions.
      Likely cause: Deleting an indexed element creates a hole, while deleting a named field can invalidate stable object-map assumptions.
      Confirm: Inspect array elements kinds or object maps before and after the deletion in an isolated scenario.
      Possible action: Use a stable sentinel field value or an explicit packed-array removal operation. (The alternative preserves absence semantics and engine evidence confirms the deletion destabilizes the path.)
    - **parameter-property-access** (static-hypothesis): A function parameter is used as a named-property receiver, so hidden-class and missing-field diversity are hot-path inputs.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
    - **dynamic-keyed-access-in-loop** (static-hypothesis): A loop performs keyed access with a dynamic key; changing key/value shapes can make its inline cache polymorphic or megamorphic.
      Likely cause: One keyed access observes string, numeric-index, symbol, or receiver-map diversity.
      Confirm: Run string, index, and symbol variants accepted by the API and inspect keyed inline-cache transitions.
      Possible action: Separate key families or normalize keys at the API boundary. (Deep engine evidence confirms a harmful polymorphic or megamorphic keyed access.)
7. `src/materials/nodes/NodeMaterial.js#NodeMaterial.setDefaultValues@1213:29700` (src/materials/nodes/NodeMaterial.js:1213, score 166)
    - **shape-or-prototype-mutation** (static-hypothesis): Object.defineProperty can invalidate hidden-class or prototype-chain assumptions.
      Likely cause: Fields or prototypes change after objects have already trained optimized code.
      Confirm: Compare object maps and prototype state across setup, warmup, and guarded stress.
      Possible action: Initialize fields in a consistent order and complete structural changes before warmup. (Map or deoptimization evidence links the late mutation to the hot workload.)
    - **ambiguous-keyed-receiver** (static-hypothesis): A function parameter is used as a dynamically keyed receiver, but the access does not prove whether it is an array, string, object, or collection-like value.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
    - **dynamic-keyed-access-in-loop** (static-hypothesis): A loop performs keyed access with a dynamic key; changing key/value shapes can make its inline cache polymorphic or megamorphic.
      Likely cause: One keyed access observes string, numeric-index, symbol, or receiver-map diversity.
      Confirm: Run string, index, and symbol variants accepted by the API and inspect keyed inline-cache transitions.
      Possible action: Separate key families or normalize keys at the API boundary. (Deep engine evidence confirms a harmful polymorphic or megamorphic keyed access.)
8. `src/renderers/webgl-fallback/utils/WebGLTimestampQueryPool.js#WebGLTimestampQueryPool.resolveQueriesAsync@185:4257` (src/renderers/webgl-fallback/utils/WebGLTimestampQueryPool.js:185, score 179)
    - **control-flow-in-loop** (static-hypothesis): AwaitExpression appears inside a loop and may dominate allocation or exception costs.
      Likely cause: Repeated allocation or exceptional/asynchronous control flow occurs inside a loop.
      Confirm: Run a representative large-input scenario and inspect allocation, GC, and branch-specific runtime evidence.
      Possible action: Hoist reusable state or separate exceptional/asynchronous work from the synchronous loop. (Profiling confirms the reported operation dominates the real hot workload.)
    - **late-instance-property-write** (static-hypothesis): A method writes an instance property outside the constructor; the first write may transition the receiver shape.
      Likely cause: Fields or prototypes change after objects have already trained optimized code.
      Confirm: Compare object maps and prototype state across setup, warmup, and guarded stress.
      Possible action: Initialize fields in a consistent order and complete structural changes before warmup. (Map or deoptimization evidence links the late mutation to the hot workload.)
    - **dynamic-keyed-access-in-loop** (static-hypothesis): A loop performs keyed access with a dynamic key; changing key/value shapes can make its inline cache polymorphic or megamorphic.
      Likely cause: One keyed access observes string, numeric-index, symbol, or receiver-map diversity.
      Confirm: Run string, index, and symbol variants accepted by the API and inspect keyed inline-cache transitions.
      Possible action: Separate key families or normalize keys at the API boundary. (Deep engine evidence confirms a harmful polymorphic or megamorphic keyed access.)
9. `src/renderers/webgl/WebGLProgram.js#WebGLProgram@412:10631` (src/renderers/webgl/WebGLProgram.js:412, score 2185)
    - **parameter-property-access** (static-hypothesis): A function parameter is used as a named-property receiver, so hidden-class and missing-field diversity are hot-path inputs.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
    - **parameter-indexed-access** (static-hypothesis): A function parameter is used as an indexed/array-like receiver, so elements kind and packedness are hot-path inputs.
      Likely cause: A receiver parameter may arrive with different array representations or object maps.
      Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
      Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)
    - **large-complex-function** (static-hypothesis): The function spans 619 lines and has 172 branch nodes, making tiering and scenario coverage harder to reason about.
      Likely cause: A large function or dense branch graph increases compilation and coverage complexity.
      Confirm: Use CPU hotness evidence and isolated branch scenarios before attributing a runtime cost to size alone.
      Possible action: Split independently hot branch families into smaller functions. (Runtime evidence shows compilation, inlining, or coverage pressure and the split preserves semantics.)
10. `src/helpers/CameraHelper.js#CameraHelper.setColors@167:3982` (src/helpers/CameraHelper.js:167, score 1550)

- **parameter-property-access** (static-hypothesis): A function parameter is used as a named-property receiver, so hidden-class and missing-field diversity are hot-path inputs.
  Likely cause: A receiver parameter may arrive with different array representations or object maps.
  Confirm: Exercise representation-specific receiver variants and require exact-site plus engine evidence.
  Possible action: Normalize receiver construction or split genuinely distinct receiver families. (The measured access site becomes unstable for supported API inputs.)

## Root graph boundaries

- <three-package>/examples/jsm/inspector/tabs/Settings.js: nonliteral dynamic import at offset 5356 makes the module graph incomplete
- <three-package>/examples/jsm/libs/demuxer_mp4.js: unresolved module edge "https://cdn.jsdelivr.net/npm/mp4box@2.3.0/+esm" (Cannot find module 'https://cdn.jsdelivr.net/npm/mp4box@2.3.0/+esm')
- <three-package>/examples/jsm/loaders/LottieLoader.js: unresolved module edge "https://cdn.jsdelivr.net/npm/lottie-web@5.13.0/+esm" (Cannot find module 'https://cdn.jsdelivr.net/npm/lottie-web@5.13.0/+esm')
- <three-package>/examples/jsm/loaders/TTFLoader.js: unresolved module edge "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/+esm" (Cannot find module 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/+esm')
- <three-package>/examples/jsm/physics/JoltPhysics.js: nonliteral dynamic import at offset 2612 makes the module graph incomplete
- <three-package>/examples/jsm/physics/RapierPhysics.js: nonliteral dynamic import at offset 3123 makes the module graph incomplete

## Interpretation

- Shape/property findings suggest testing stable, reordered, extra, and missing-field objects; they do not imply that polymorphism is harmful by itself.
- Dynamic keyed accesses in loops deserve string/index/key-family scenarios and IC evidence before a rewrite.
- Numeric findings deserve only API-valid SMI/double/-0/boundary variants with an args-aware semantic oracle.
- The package-root scan includes source, distributions, WebGL/WebGPU, and examples. Prefer narrow public modules for runtime proof so unrelated browser/CDN code cannot masquerade as covered.
