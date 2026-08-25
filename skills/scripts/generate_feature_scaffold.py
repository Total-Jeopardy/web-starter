#!/usr/bin/env python3
"""Generate a feature-first scaffold that matches the web-starter template.

Usage:
    python skills/scripts/generate_feature_scaffold.py booking-history
    python skills/scripts/generate_feature_scaffold.py booking-history --with-tests
    python skills/scripts/generate_feature_scaffold.py booking-history --no-use-cases
"""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FEATURES_DIR = ROOT / "features"
TEST_FEATURES_DIR = ROOT / "test" / "features"


def kebab_to_pascal(value: str) -> str:
    return "".join(part.capitalize() for part in value.split("-") if part)


def kebab_to_camel(value: str) -> str:
    pascal = kebab_to_pascal(value)
    if not pascal:
        return ""
    return pascal[0].lower() + pascal[1:]


def write_if_missing(path: Path, content: str, created: list[Path]) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    created.append(path)


def render_entity(class_name: str) -> str:
    return f"""export interface {class_name}Item {{
  id: string;
  title: string;
}}
"""


def render_state(feature: str, class_name: str) -> str:
    return f"""import type {{ {class_name}Item }} from '@/features/{feature}/domain/entities/{feature}-item';

export type {class_name}State =
  | {{ status: 'initial' }}
  | {{ status: 'loading' }}
  | {{ status: 'loaded'; items: {class_name}Item[] }}
  | {{ status: 'error'; message: string }};

export const initial{class_name}State: {class_name}State = {{ status: 'initial' }};
"""


def render_repository_contract(feature: str, class_name: str) -> str:
    return f"""import type {{ Result, ApiError }} from '@/core/network/api-result';
import type {{ {class_name}Item }} from '@/features/{feature}/domain/entities/{feature}-item';

export interface {class_name}Repository {{
  fetchAll(): Promise<Result<{class_name}Item[], ApiError>>;
}}
"""


def render_remote_source(feature: str, class_name: str) -> str:
    return f"""import type {{ ApiClient }} from '@/core/network/api-client';
import type {{ Result, ApiError }} from '@/core/network/api-result';

export interface {class_name}ItemDto {{
  id: string;
  title: string;
}}

export class {class_name}RemoteSource {{
  constructor(private readonly api: ApiClient) {{}}

  fetchAll(): Promise<Result<{class_name}ItemDto[], ApiError>> {{
    return this.api.get<{class_name}ItemDto[]>('/api/v1/{feature}');
  }}
}}
"""


def render_repository_impl(feature: str, class_name: str) -> str:
    return f"""import type {{ Result, ApiError }} from '@/core/network/api-result';
import type {{ {class_name}Repository }} from '@/features/{feature}/domain/repositories/{feature}-repository';
import type {{ {class_name}Item }} from '@/features/{feature}/domain/entities/{feature}-item';
import type {{ {class_name}RemoteSource }} from '@/features/{feature}/data/sources/{feature}-remote-source';

export class {class_name}RepositoryImpl implements {class_name}Repository {{
  constructor(private readonly remote: {class_name}RemoteSource) {{}}

  async fetchAll(): Promise<Result<{class_name}Item[], ApiError>> {{
    const result = await this.remote.fetchAll();
    if (!result.ok) return result;

    return {{
      ok: true,
      value: result.value.map((dto) => ({{ id: dto.id, title: dto.title }})),
    }};
  }}
}}
"""


def render_use_case_readme() -> str:
    return """Add verb-named use-cases here when the feature action coordinates
multiple dependencies, contains branching business logic, or needs direct
unit tests outside the hook.
"""


def render_use_case(feature: str, class_name: str) -> str:
    return f"""import type {{ Result, ApiError }} from '@/core/network/api-result';
import type {{ {class_name}Item }} from '@/features/{feature}/domain/entities/{feature}-item';
import type {{ {class_name}Repository }} from '@/features/{feature}/domain/repositories/{feature}-repository';

export class Load{class_name}UseCase {{
  constructor(private readonly repository: {class_name}Repository) {{}}

  execute(): Promise<Result<{class_name}Item[], ApiError>> {{
    return this.repository.fetchAll();
  }}
}}
"""


def render_hook(feature: str, class_name: str, with_use_cases: bool) -> str:
    camel = kebab_to_camel(feature)
    if with_use_cases:
        fetch_import = (
            f"import {{ Load{class_name}UseCase }} from "
            f"'@/features/{feature}/domain/use-cases/load-{feature}-use-case';\n"
        )
        build_call = f"new Load{class_name}UseCase(repository).execute()"
    else:
        fetch_import = ""
        build_call = "repository.fetchAll()"

    return f"""'use client';

import {{ useQuery }} from '@tanstack/react-query';
import {{ unwrapOrThrow }} from '@/core/network/api-result';
import {{ getApiClient }} from '@/core/network/api-client';
import {{ {class_name}RemoteSource }} from '@/features/{feature}/data/sources/{feature}-remote-source';
import {{ {class_name}RepositoryImpl }} from '@/features/{feature}/data/repositories/{feature}-repository-impl';
{fetch_import}
export function use{class_name}() {{
  return useQuery({{
    queryKey: ['{feature}'],
    queryFn: async () => {{
      const repository = new {class_name}RepositoryImpl(new {class_name}RemoteSource(getApiClient()));
      return unwrapOrThrow(await {build_call});
    }},
  }});
}}
"""


def render_store(feature: str, class_name: str) -> str:
    return f"""import {{ create }} from 'zustand';

interface {class_name}FilterStore {{
  query: string;
  setQuery: (query: string) => void;
}}

/** Client-only UI state for this feature. Server data belongs in use{class_name}(), not here. */
export const use{class_name}FilterStore = create<{class_name}FilterStore>((set) => ({{
  query: '',
  setQuery: (query) => set({{ query }}),
}}));
"""


def render_view(feature: str, class_name: str) -> str:
    camel = kebab_to_camel(feature)
    return f"""'use client';

import {{ use{class_name} }} from '@/features/{feature}/presentation/hooks/use-{feature}';
import {{ AppSkeleton }} from '@/core/shared/components/app-skeleton';
import {{ AppErrorState }} from '@/core/shared/components/app-error-state';
import {{ AppEmptyState }} from '@/core/shared/components/app-empty-state';

export function {class_name}View() {{
  const {{ data, isLoading, error, refetch }} = use{class_name}();

  if (isLoading) return <AppSkeleton />;
  if (error) return <AppErrorState description={{error.message}} onRetry={{() => refetch()}} />;
  if (!data || data.length === 0) return <AppEmptyState />;

  return (
    <ul className="space-y-2">
      {{data.map((item) => (
        <li key={{item.id}} className="rounded-md border p-3 text-sm">
          {{item.title}}
        </li>
      ))}}
    </ul>
  );
}}
"""


def render_use_case_test(feature: str, class_name: str) -> str:
    return f"""import {{ describe, expect, it }} from 'vitest';
import {{ Load{class_name}UseCase }} from '@/features/{feature}/domain/use-cases/load-{feature}-use-case';
import type {{ {class_name}Repository }} from '@/features/{feature}/domain/repositories/{feature}-repository';
import type {{ {class_name}Item }} from '@/features/{feature}/domain/entities/{feature}-item';
import type {{ Result, ApiError }} from '@/core/network/api-result';

class Fake{class_name}Repository implements {class_name}Repository {{
  constructor(private readonly result: Result<{class_name}Item[], ApiError>) {{}}

  static success(): Fake{class_name}Repository {{
    return new Fake{class_name}Repository({{ ok: true, value: [{{ id: '1', title: '{class_name} item' }}] }});
  }}

  static error(): Fake{class_name}Repository {{
    return new Fake{class_name}Repository({{ ok: false, error: {{ message: 'Request failed' }} }});
  }}

  fetchAll(): Promise<Result<{class_name}Item[], ApiError>> {{
    return Promise.resolve(this.result);
  }}
}}

describe('Load{class_name}UseCase', () => {{
  it('returns repository data on success', async () => {{
    const useCase = new Load{class_name}UseCase(Fake{class_name}Repository.success());

    const result = await useCase.execute();

    expect(result.ok).toBe(true);
  }});

  it('returns repository errors without swallowing them', async () => {{
    const useCase = new Load{class_name}UseCase(Fake{class_name}Repository.error());

    const result = await useCase.execute();

    expect(result.ok).toBe(false);
  }});
}});
"""


def render_repository_test(feature: str, class_name: str) -> str:
    return f"""import {{ describe, expect, it }} from 'vitest';
import {{ {class_name}RepositoryImpl }} from '@/features/{feature}/data/repositories/{feature}-repository-impl';
import type {{ {class_name}RemoteSource, {class_name}ItemDto }} from '@/features/{feature}/data/sources/{feature}-remote-source';
import type {{ Result, ApiError }} from '@/core/network/api-result';

class Fake{class_name}RemoteSource {{
  constructor(private readonly result: Result<{class_name}ItemDto[], ApiError>) {{}}

  static success(): Fake{class_name}RemoteSource {{
    return new Fake{class_name}RemoteSource({{ ok: true, value: [{{ id: '1', title: '{class_name} item' }}] }});
  }}

  static error(): Fake{class_name}RemoteSource {{
    return new Fake{class_name}RemoteSource({{ ok: false, error: {{ message: 'Request failed' }} }});
  }}

  fetchAll(): Promise<Result<{class_name}ItemDto[], ApiError>> {{
    return Promise.resolve(this.result);
  }}
}}

describe('{class_name}RepositoryImpl', () => {{
  it('maps remote DTOs into domain entities', async () => {{
    const repository = new {class_name}RepositoryImpl(Fake{class_name}RemoteSource.success() as unknown as {class_name}RemoteSource);

    const result = await repository.fetchAll();

    expect(result.ok).toBe(true);
  }});

  it('passes through remote errors unchanged', async () => {{
    const repository = new {class_name}RepositoryImpl(Fake{class_name}RemoteSource.error() as unknown as {class_name}RemoteSource);

    const result = await repository.fetchAll();

    expect(result.ok).toBe(false);
  }});
}});
"""


def render_hook_test(feature: str, class_name: str) -> str:
    camel = kebab_to_camel(feature)
    return f"""import {{ describe, expect, it }} from 'vitest';
import {{ renderHook, waitFor }} from '@testing-library/react';
import {{ QueryClient, QueryClientProvider }} from '@tanstack/react-query';
import type {{ ReactNode }} from 'react';
import {{ use{class_name} }} from '@/features/{feature}/presentation/hooks/use-{feature}';

function createWrapper() {{
  const queryClient = new QueryClient({{ defaultOptions: {{ queries: {{ retry: false }} }} }});
  return ({{ children }}: {{ children: ReactNode }}) => (
    <QueryClientProvider client={{queryClient}}>{{children}}</QueryClientProvider>
  );
}}

describe('use{class_name}', () => {{
  it('resolves to a settled query state', async () => {{
    const {{ result }} = renderHook(() => use{class_name}(), {{ wrapper: createWrapper() }});

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  }});
}});
"""


def render_view_test(feature: str, class_name: str) -> str:
    return f"""import {{ describe, expect, it }} from 'vitest';
import {{ render, screen }} from '@testing-library/react';
import {{ QueryClient, QueryClientProvider }} from '@tanstack/react-query';
import {{ {class_name}View }} from '@/features/{feature}/presentation/components/{feature}-view';

function renderWithProviders(ui: React.ReactElement) {{
  const queryClient = new QueryClient({{ defaultOptions: {{ queries: {{ retry: false }} }} }});
  return render(<QueryClientProvider client={{queryClient}}>{{ui}}</QueryClientProvider>);
}}

describe('{class_name}View', () => {{
  it('renders without crashing', () => {{
    renderWithProviders(<{class_name}View />);

    expect(document.body).toBeTruthy();
  }});
}});
"""


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a feature-first scaffold matching the web-starter template's "
        "data/domain/presentation structure.",
    )
    parser.add_argument("feature_name", help="kebab-case feature name, e.g. booking-history")
    parser.add_argument(
        "--with-use-cases",
        dest="with_use_cases",
        action="store_true",
        help="create domain/use-cases/ for non-trivial feature orchestration (default: on)",
    )
    parser.add_argument(
        "--no-use-cases",
        dest="with_use_cases",
        action="store_false",
        help="skip domain/use-cases/ for trivial hook-to-repository features",
    )
    parser.add_argument(
        "--with-tests",
        dest="with_tests",
        action="store_true",
        help="also create matching test/features/<feature>/ scaffold (default: off — this "
        "template ships no example project feature, so generated tests are opt-in)",
    )
    parser.add_argument(
        "--no-tests",
        dest="with_tests",
        action="store_false",
        help="skip generated test/features/<feature>/ scaffold (this is already the default)",
    )
    parser.set_defaults(with_use_cases=True, with_tests=False)
    args = parser.parse_args()

    feature = args.feature_name.strip().lower()
    if not feature or any(ch not in "abcdefghijklmnopqrstuvwxyz0123456789-" for ch in feature):
        raise SystemExit("feature_name must be kebab-case (lowercase letters, digits, hyphens)")
    if feature.startswith("-") or feature.endswith("-") or "--" in feature:
        raise SystemExit("feature_name must be kebab-case (no leading/trailing/double hyphens)")

    class_name = kebab_to_pascal(feature)
    base = FEATURES_DIR / feature
    created: list[Path] = []

    write_if_missing(base / "domain" / "entities" / f"{feature}-item.ts", render_entity(class_name), created)
    write_if_missing(base / "domain" / "entities" / f"{feature}-state.ts", render_state(feature, class_name), created)
    write_if_missing(
        base / "domain" / "repositories" / f"{feature}-repository.ts",
        render_repository_contract(feature, class_name),
        created,
    )
    if args.with_use_cases:
        write_if_missing(base / "domain" / "use-cases" / "README.md", render_use_case_readme(), created)
        write_if_missing(
            base / "domain" / "use-cases" / f"load-{feature}-use-case.ts",
            render_use_case(feature, class_name),
            created,
        )
    write_if_missing(
        base / "data" / "sources" / f"{feature}-remote-source.ts",
        render_remote_source(feature, class_name),
        created,
    )
    write_if_missing(
        base / "data" / "repositories" / f"{feature}-repository-impl.ts",
        render_repository_impl(feature, class_name),
        created,
    )
    write_if_missing(
        base / "presentation" / "hooks" / f"use-{feature}.ts",
        render_hook(feature, class_name, args.with_use_cases),
        created,
    )
    write_if_missing(
        base / "presentation" / "stores" / f"{feature}-filter-store.ts",
        render_store(feature, class_name),
        created,
    )
    write_if_missing(
        base / "presentation" / "components" / f"{feature}-view.tsx",
        render_view(feature, class_name),
        created,
    )

    if args.with_tests:
        test_base = TEST_FEATURES_DIR / feature
        write_if_missing(
            test_base / "data" / "repositories" / f"{feature}-repository-impl.test.ts",
            render_repository_test(feature, class_name),
            created,
        )
        if args.with_use_cases:
            write_if_missing(
                test_base / "domain" / "use-cases" / f"load-{feature}-use-case.test.ts",
                render_use_case_test(feature, class_name),
                created,
            )
        write_if_missing(
            test_base / "presentation" / "hooks" / f"use-{feature}.test.tsx",
            render_hook_test(feature, class_name),
            created,
        )
        write_if_missing(
            test_base / "presentation" / "components" / f"{feature}-view.test.tsx",
            render_view_test(feature, class_name),
            created,
        )

    if created:
        for path in created:
            print(path.relative_to(ROOT))
    else:
        print("No files created; scaffold already exists.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
