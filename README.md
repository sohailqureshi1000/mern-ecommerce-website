# SOHAIL

Dark streetwear ecommerce site, rebuilt as a MERN stack app. Originally a static HTML/CSS/JS storefront; this repo is the full-stack version with JWT auth and MongoDB Atlas.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT |

## Status

Early rebuild. `client/` (React) and `server/` (Express) are the planned app roots; they are not in the tree yet.

## Project layout (planned)

```
client/   React storefront (Vite)
server/   Express API
```

## Conventions

- Functional React components and hooks only
- `async/await` (no `.then` chains)
- Conventional Commits (`feat`, `fix`, `docs`, `chore`, `refactor`)
- Branches: `feature/<name>`, `fix/<name>`
- Keep the existing dark theme and **SOHAIL** branding

## License

MIT — see [LICENSE](LICENSE).


## AI Tool: searchProducts

**Name:** `searchProducts`

**Schema:**
- `query` (string, required) — product name or category keyword
- `maxPrice` (number, optional) — max price filter in USD

**Returns:** Array of `{ id, name, price, category, image }` objects (max 5 results).
Throws an error if no products match — rendered as a designed error card in the UI, not a crash.

**Tool lifecycle states** (rendered in `client/src/ChatPage.jsx` via the `ToolCard` component):
1. `input-streaming` — skeleton/pulsing placeholder while the model builds the search arguments
2. `input-available` — spinner shown while the tool executes, displaying the search query
3. `output-available` — results rendered as a product card grid (image, name, price)
4. `output-error` — designed red error card with the failure message

## 3D Product Viewer (`/3d-viewer`) — FE-AA2 Feature

### Overview & Built Features
- **Interactive R3F Scene:** Renders real-time 3D assets with smooth `OrbitControls`, `ContactShadows`, and dynamic environment lighting.
- **Live Material Configurator:** Integrated `Leva` control panel allowing live material tweaking (color, metalness, roughness, wireframe mode, auto-rotation speed).
- **Drag & Drop GLB Support:** Built-in dropzone allowing users to drop custom `.glb` 3D files directly onto the canvas to instantly view and inspect their own models.

### FE-10 Performance Note (Optimization Lens)
- **Code-Splitting & Lazy Loading:** Three.js and `@react-three/fiber` bundles are isolated into a separate dynamic chunk via `React.lazy()` to protect initial load performance.
- **Dynamic DPR Clamping:** Hardware pixel ratio is strictly capped to `dpr={[1, 1.5]}` to maintain high frame rates (FPS) and reduce GPU thermal throttling on high-DPI/mobile screens.
- **Adaptive Fallback Strategy:** Checks user system constraints (`prefers-reduced-motion` and `navigator.deviceMemory < 4`) to conditionally skip heavy WebGL canvas initialization and serve a lightweight static preview asset (`3d-fallback-preview.png`).
- **Zero Server Overhead:** Drag-and-drop model processing generates local Object URLs, eliminating API network overhead for custom assets.

### Future Enhancements
- Integration of DRACO mesh compression for model file size reduction.
- Custom HDR environment map selector.
- High-res scene snapshot/screenshot download feature.