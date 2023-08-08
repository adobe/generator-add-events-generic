/* <% if (false) { %>
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
<% } %>
* <license header>
*/

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn()
  }
}))
const { Core } = require('@adobe/aio-sdk')
const mockLoggerInstance = { info: jest.fn() }
Core.Logger.mockReturnValue(mockLoggerInstance)

const action = require('./<%= actionRelPath %>')

beforeEach(() => {
  Core.Logger.mockClear()
  mockLoggerInstance.info.mockReset()
})

describe('test event action', () => {
  test('main should be defined', () => {
    expect(action.main).toBeInstanceOf(Function)
  })
  test('should set logger to use LOG_LEVEL param', async () => {
    await action.main({LOG_LEVEL: 'fakeLevel'})
    expect(Core.Logger).toHaveBeenCalledWith('main',
        {level: 'fakeLevel'})
  })
})
