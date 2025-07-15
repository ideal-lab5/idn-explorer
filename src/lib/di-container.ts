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

import 'reflect-metadata';
import { container } from 'tsyringe';
import { ChainStateService } from '../services/ChainStateService';
import { ExplorerService } from '../services/ExplorerService';
import { IChainStateService } from '../services/IChainStateService';
import { IExplorerService } from '../services/IExplorerService';
import { IPolkadotApiService } from '../services/IPolkadotApiService';
import { ISubscriptionService } from '../services/ISubscriptionService';
import { IdnSubscriptionService } from '../services/IdnSubscriptionService';
import { PolkadotApiService } from '../services/PolkadotApiService';

// Only register services if we're in a browser environment
if (typeof window !== 'undefined') {
  // Register services
  container.registerSingleton<IPolkadotApiService>('IPolkadotApiService', PolkadotApiService);

  container.registerSingleton<IChainStateService>('IChainStateService', ChainStateService);

  container.registerSingleton<IExplorerService>('IExplorerService', ExplorerService);

  container.registerSingleton<ISubscriptionService>('ISubscriptionService', IdnSubscriptionService);
}

export { container };
