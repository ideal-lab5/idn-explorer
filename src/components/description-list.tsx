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

import clsx from 'clsx'

export function DescriptionList({ className, ...props }: React.ComponentPropsWithoutRef<'dl'>) {
  return (
    <dl
      {...props}
      className={clsx(
        className,
        'grid grid-cols-1 text-base/6 sm:grid-cols-[min(50%,theme(spacing.80))_auto] sm:text-sm/6'
      )}
    />
  )
}

export function DescriptionTerm({ className, ...props }: React.ComponentPropsWithoutRef<'dt'>) {
  return (
    <dt
      {...props}
      className={clsx(
        className,
        'col-start-1 border-t border-zinc-950/5 pt-3 text-zinc-500 first:border-none sm:border-t sm:border-zinc-950/5 sm:py-3 dark:border-white/5 dark:text-zinc-400 sm:dark:border-white/5'
      )}
    />
  )
}

export function DescriptionDetails({ className, ...props }: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <dd
      {...props}
      className={clsx(
        className,
        'pb-3 pt-1 text-zinc-950 sm:border-t sm:border-zinc-950/5 sm:py-3 dark:text-white dark:sm:border-white/5 sm:[&:nth-child(2)]:border-none'
      )}
    />
  )
}
