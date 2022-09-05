/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { FlashClient } from '@superset-ui/core';
import { FlashExtendTtl, FlashObject, FlashServiceObject, FlashUpdateOwnership, FlashUpdateQuery, FlashUpdateSchedule } from '../types';

export const fetchDatabases = async (): Promise<any> =>
  await FlashClient.get<FlashServiceObject[]>('v1/datastore');

export const fetchUsers = async (queryParams : any): Promise<any> =>
  await FlashClient.get<FlashServiceObject[]>('v1/flash/'+ '?' + queryParams);

export const createFlash = (payload: FlashObject): Promise<any> =>
  FlashClient.post<FlashServiceObject>('v1/flash/', payload);

export const updateFlash = async (id: number, type: string, payload: FlashUpdateOwnership | FlashExtendTtl | FlashUpdateSchedule | FlashUpdateQuery ): Promise<any> =>
  await FlashClient.patch<any>(`v1/flash/${id}/${type}`, payload);

export const removeFlash = async (id:number): Promise<any> =>
  await FlashClient.delete<FlashServiceObject>(`v1/flash/${id}`);
