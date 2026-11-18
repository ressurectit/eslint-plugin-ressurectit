import {Injectable} from '@angular/core';
import {BaseUrl, DefaultHeaders, GET, QueryObject, ParameterTransform, ResponseTransform, RESTClient, RESTClientBase} from '@anglr/rest';
import {PagedData} from '@jscrpt/common';
import {NEVER, Observable, forkJoin, map, mergeMap, of} from 'rxjs';

import {config} from '../../../config';
import {AsyncTask} from './asynctask.interface';
import {gridPagingToPageable} from '../transforms';
import {EnumService} from '../enum';
import {GridPaging, PopisInfo} from '../../../interfaces';

/**
 * Transform response from getAsyncTasks method
 */
function getAsyncTasksResponseTransform(this: RESTClientBase, response: Observable<PagedData<AsyncTask>>): Observable<PagedData<AsyncTask>>
{
    const enumService = this.injector.get(EnumService);

    return response.pipe(mergeMap(data =>
                         {
                             return forkJoin(
                             [
                                 of(data),
                                 enumService.getEnumObj<PopisInfo>('typAsyncTasku'),
                                 enumService.getEnumObj<PopisInfo>('stavAsyncTasku'),
                             ]);
                         }),
                         map(([result, typ, stav]) =>
                         {
                             result.content?.forEach(itm =>
                             {
                                 itm.stavEnum = itm.stav;
                                 itm.typ = typ[itm.typ ?? '']?.kratkyPopis;
                                 itm.stav = stav[itm.stav ?? '']?.popis;
                             });

                             return result;
                         }));
}

/**
 * Service used to access async tasks
 */
@Injectable()
@BaseUrl(`${config.configuration.apiBaseUrl}asynctask`)
@DefaultHeaders(config.configuration.defaultApiHeaders)
export class AsynctaskService extends RESTClient
{
    //######################### public methods #########################

    /**
     * Gets array of async tasks
     * @param _paging - Paging of requested data
     */
    @ResponseTransform(getAsyncTasksResponseTransform)
    @GET('/moje/platne')
    public getAsyncTasks(@QueryObject @ParameterTransform(gridPagingToPageable) _paging?: GridPaging): Observable<PagedData<AsyncTask>>
    {
        return NEVER;
    }
}
