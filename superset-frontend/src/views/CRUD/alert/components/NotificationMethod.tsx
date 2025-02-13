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
/* eslint-disable theme-colors/no-literal-colors */

import React, { FunctionComponent, useState, useEffect } from 'react';
import { styled, t, useTheme } from '@superset-ui/core';
import { Select } from 'src/components';
import Icons from 'src/components/Icons';
import {
  NotificationMethodOption,
  RecipientIconName,
} from 'src/views/CRUD/alert/types';
import { StyledInputContainer } from '../AlertReportModal';
import { ERROR_MESSAGES } from '../constants';

const StyledNotificationMethod = styled.div`
  margin-bottom: 10px;

  .error-text {
    color: red;
    font-size: 11px;
  }
  .input-container {
    textarea {
      height: auto;
    }
  }

  .prominent-error-input {
    border: 1px solid red;
  }

  .inline-container {
    margin-bottom: 10px;

    .input-container {
      margin-left: 10px;
    }

    > div {
      margin: 0;
    }

    .delete-button {
      margin-left: 10px;
      padding-top: 3px;
    }
  }
`;

type NotificationSetting = {
  method?: NotificationMethodOption;
  recipients: string;
  options: NotificationMethodOption[];
};

interface NotificationMethodProps {
  setting?: NotificationSetting | null;
  index: number;
  onUpdate?: (index: number, updatedSetting: NotificationSetting) => void;
  onRemove?: (index: number) => void;
  invalidInput?: any;
}

export const NotificationMethod: FunctionComponent<NotificationMethodProps> = ({
  setting = null,
  index,
  onUpdate,
  onRemove,
  invalidInput,
}) => {
  const { method, recipients, options } = setting || {};
  const [recipientValue, setRecipientValue] = useState<string>(
    recipients || '',
  );
  const [invalid, setInvalid] = useState<any>(
    invalidInput || {
      invalid: false,
      emailError: '',
      voError: '',
    },
  );

  useEffect(() => {
    if (invalidInput) {
      setInvalid(invalidInput);
    }
  }, [invalidInput]);
  const theme = useTheme();

  if (!setting) {
    return null;
  }

  const onMethodChange = (method: NotificationMethodOption) => {
    // Since we're swapping the method, reset the recipients
    setInvalid({
      invalid: false,
      error: '',
    });
    setRecipientValue('');
    if (onUpdate) {
      const updatedSetting = {
        ...setting,
        method,
        recipients: '',
      };

      onUpdate(index, updatedSetting);
    }
  };

  const onRecipientsChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { target } = event;
    setRecipientValue(target.value);

    if (onUpdate) {
      const updatedSetting = {
        ...setting,
        recipients: target.value,
      };

      onUpdate(index, updatedSetting);
    }
  };

  // Set recipients
  if (!!recipients && recipientValue !== recipients) {
    setRecipientValue(recipients);
  }

  const getMethodHelpText = (method: string) => {
    if (method === RecipientIconName.Email) {
      return (
        <div className="helper">
          {t(
            'Recipients are separated by "," or ";" and must contain (@careem.com OR @ext.careem.com)',
          )}
        </div>
      );
    }
    if (method === RecipientIconName.VO) {
      return (
        <div className="helper">
          {t(ERROR_MESSAGES.ROUTING_KEY_PATTERN_ERROR)}
        </div>
      );
    }

    return <div>{t('Recipients are separated by "," or ";"')}</div>;
  };

  return (
    <StyledNotificationMethod>
      <div className="inline-container">
        <StyledInputContainer>
          <div className="input-container">
            <Select
              ariaLabel={t('Delivery method')}
              data-test="select-delivery-method"
              onChange={onMethodChange}
              placeholder={t('Select Delivery Method')}
              options={(options || []).map(
                (method: NotificationMethodOption) => ({
                  label: method,
                  value: method,
                }),
              )}
              value={method}
            />
          </div>
        </StyledInputContainer>
        {method !== undefined && !!onRemove ? (
          <span
            role="button"
            tabIndex={0}
            className="delete-button"
            onClick={() => onRemove(index)}
          >
            <Icons.Trash iconColor={theme.colors.grayscale.base} />
          </span>
        ) : null}
      </div>
      {method !== undefined ? (
        <StyledInputContainer>
          <div className="control-label">
            {method === RecipientIconName.VO ? t('Routing key') : t(method)}
          </div>
          <div className="input-container">
            <textarea
              className={
                (invalid?.emailError && method === RecipientIconName.Email) ||
                (invalid?.voError && method === RecipientIconName.VO)
                  ? 'prominent-error-input'
                  : ''
              }
              name="recipients"
              value={recipientValue}
              onChange={onRecipientsChange}
            />
          </div>
          {invalid?.emailError && method === RecipientIconName.Email ? (
            <div className="error-text">
              {t(ERROR_MESSAGES.EMAIL_PATTERN_ERROR)}
            </div>
          ) : null}
          {invalid?.voError && method === RecipientIconName.VO ? (
            <div className="error-text">{invalid?.voError}</div>
          ) : null}
          {getMethodHelpText(method)}
        </StyledInputContainer>
      ) : null}
    </StyledNotificationMethod>
  );
};
