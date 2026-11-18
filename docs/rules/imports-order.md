# Checks whether are imports in correct order (imports-order)

Rule which checks order of `import` sources.

Recommended order is as follows.
 - `@angular/core`
 - `@angular/core/*` (for example `@angular/core/rxjs-interop`)
 - other `@angular/*`
 - `@anglr/*`
 - `@jscrpt/common` (and `@jscrpt/common/*`)
 - other `@jscrpt/*`
 - other scoped packages (`@*/*`)
 - other absolute imports
 - relative imports

Groups are matched on the scope segment and package name, not on a raw prefix, so `@angularx-foo/bar` is an *other scoped* package.


## Rule Details

This rule aims to ordering of `import` statements.

Examples of **incorrect** code for this rule:

```js
import {FormBuilder} from '@angular/forms';
import {AuthGuard, Authorize} from '@anglr/authentication';
import {ActivatedRoute, Router} from '@angular/router';
import {Component, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {Observable} from 'rxjs';
import {ComponentRedirectRoute, ComponentRoute} from '@anglr/common/router';
import {BasePrehladComponent} from '../../../misc/basePrehladComponent';

import {AsyncDataLoaderOptions, SimpleOrdering} from '@anglr/grid';
import {MeraniaService, MeranieItem} from '../../../services/api/merania';
import {Orderable, Pageable, PagedData} from '../../../misc/types';

```

Examples of **correct** code for this rule:

```js
import {Component, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthGuard, Authorize} from '@anglr/authentication';
import {ComponentRedirectRoute, ComponentRoute} from '@anglr/common/router';
import {AsyncDataLoaderOptions, SimpleOrdering} from '@anglr/grid';
import {Observable} from 'rxjs';

import {BasePrehladComponent} from '../../../misc/basePrehladComponent';
import {MeraniaService, MeranieItem} from '../../../services/api/merania';
import {Orderable, Pageable, PagedData} from '../../../misc/types';

```

### Options

There are no options for this rule.

## When Not To Use It

Do not use this rule if you need to have special order of imports. Typically that means that you have some code in between import statements.
