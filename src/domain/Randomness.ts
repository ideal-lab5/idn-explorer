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

/**
 * This is the Randomness domain class. It is used to represent a generated random value.
 */
export class Randomness {
  block: number;
  randomness: string;
  signature: string;
  status: string = 'Generated';

  constructor(block: number, randomness: string, signature: string) {
    this.block = block;
    this.randomness = randomness;
    this.signature = signature;
  }
}
