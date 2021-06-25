# Checks new lines between imports (imports-spacing)

Rule which checks recommended whitespacing between `import` statements.


## Rule Details

This rule aims to correcting whitespaces between `import` statements.

Separates relative imports from absolute imports using new line.

Examples of **incorrect** code for this rule:

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

Do not use this rule if you need to have some code between `import` statements.
