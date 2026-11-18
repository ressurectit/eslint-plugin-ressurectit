/**
 * @fileoverview Tests for imports-spacing rule
 */

import {ruleTester} from '../helpers/ruleTester.js';
import rule from '../../lib/rules/imports-spacing.js';

const asynctask = `
import {Injectable} from '@angular/core';
import {BaseUrl, DefaultHeaders, GET, QueryObject, ParameterTransform, ResponseTransform, RESTClient, RESTClientBase} from '@anglr/rest';
import {PagedData} from '@jscrpt/common';
import {NEVER, Observable, forkJoin, map, mergeMap, of} from 'rxjs';

import {config} from '../../../config';
import {AsyncTask} from './asynctask.interface';
import {gridPagingToPageable} from '../transforms';
import {EnumService} from '../enum';
import {GridPaging, PopisInfo} from '../../../interfaces';
`;

const hodnotenie = `
import {lastValueFrom, map} from 'rxjs';

import {handleError} from '../../../misc/rxjsOperators';

import {HodnotenieDetail, HodnotenieIndikator, HodnotenieLavaStranaMetadata, HodnotenieMetadata, HodnotenieMetadataDescription, HodnotenieService, MosiaEnumItem, MosiaSprava, MosiaUtvarDetail} from '../../../services/api/hodnotenie';
`;

ruleTester.run('imports-spacing', rule,
{
    valid:
    [
        asynctask,
    ],
    invalid:
    [
        {
            name: 'empty line between relative imports',
            code: hodnotenie,
            output: hodnotenie.replace(/\n\n(import \{HodnotenieDetail)/, '\n$1'),
            errors: [{messageId: 'emptyLineForbidden'}],
        },
    ],
});
