/*
 * Copyright 2025 by Ideal Labs, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { IExplorerService } from "@/services/IExplorerService";
import { container } from './di-container';

// Only create the client in browser environment
let explorerClient: IExplorerService | null = null;

if (typeof window !== 'undefined') {
  explorerClient = container.resolve<IExplorerService>('IExplorerService');
}

export { explorerClient };
