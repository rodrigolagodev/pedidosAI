---
description: Scaffold a new feature or component following project guidelines.
---

# Scaffold Feature Workflow

Use this workflow to create new components or features, ensuring consistent structure.

1. **Input Collection**
   Determine:
   - **Name**: (e.g., `OrderList`)
   - **Type**: `component` (shared) or `feature` (domain-specific)
   - **Parent**: (e.g., `src/components/orders` or `src/components/ui`)

2. **Create Directory**
   Create the directory for the component (Co-location pattern).
   ```bash
   mkdir -p src/components/<parent>/<Name>
   ```

3. **Create Files**
   Create the standard files:

   **`index.ts`**
   ```typescript
   export { <Name> } from './<Name>';
   ```

   **`<Name>.tsx`**
   ```typescript
   import { type FC } from 'react';

   interface <Name>Props {
     // props
   }

   export const <Name>: FC<<Name>Props> = ({ ...props }) => {
     return (
       <div>
         {/* content */}
       </div>
     );
   };
   ```

   **`<Name>.test.tsx`**
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { <Name> } from './<Name>';

   describe('<Name>', () => {
     it('renders correctly', () => {
       render(<<Name> />);
       // assertions
     });
   });
   ```

4. **Register**
   If applicable, export from the parent `index.ts`.
