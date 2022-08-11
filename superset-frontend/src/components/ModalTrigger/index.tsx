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
import React, { useState } from 'react';
import Modal from 'src/components/Modal';
import Button from 'src/components/Button';

interface ModalTriggerProps {
  dialogClassName?: string;
  triggerNode: React.ReactNode;
  modalTitle?: string;
  modalBody?: React.ReactNode; // not required because it can be generated by beforeOpen
  modalFooter?: React.ReactNode;
  beforeOpen?: Function;
  onExit?: Function;
  isButton?: boolean;
  className?: string;
  tooltip?: string;
  width?: string;
  maxWidth?: string;
  responsive?: boolean;
  resizable?: boolean;
  resizableConfig?: any;
  draggable?: boolean;
  draggableConfig?: any;
  destroyOnClose?: boolean;
  disabled?: boolean;
}

export interface ModalTriggerRef {
  current: {
    close: Function;
    open: Function;
  };
}

const ModalTrigger = React.forwardRef(
  (props: ModalTriggerProps, ref: ModalTriggerRef | null) => {
    const [showModal, setShowModal] = useState(false);
    const {
      beforeOpen = () => {},
      onExit = () => {},
      isButton = false,
      resizable = false,
      draggable = false,
      className = '',
      tooltip,
      modalFooter,
      triggerNode,
      destroyOnClose = true,
      modalBody,
      draggableConfig = {},
      resizableConfig = {},
      modalTitle,
      responsive,
      width,
      maxWidth,
      disabled,
    } = props;

    const close = () => {
      setShowModal(false);
      onExit?.();
    };

    const open = (e: React.MouseEvent) => {
      e.preventDefault();
      beforeOpen?.();
      setShowModal(true);
    };

    if (ref) {
      ref.current = { close, open }; // eslint-disable-line
    }

    /* eslint-disable jsx-a11y/interactive-supports-focus */
    return (
      <>
        {isButton && (
          <Button
            className="modal-trigger"
            data-test="btn-modal-trigger"
            tooltip={tooltip}
            onClick={open}
          >
            {triggerNode}
          </Button>
        )}
        {!isButton && (
          <span
            data-test="span-modal-trigger"
            onClick={disabled ? undefined : open}
            role="button"
          >
            {triggerNode}
          </span>
        )}
        <Modal
          className={className}
          show={showModal}
          onHide={close}
          title={modalTitle}
          footer={modalFooter}
          hideFooter={!modalFooter}
          width={width}
          maxWidth={maxWidth}
          responsive={responsive}
          resizable={resizable}
          resizableConfig={resizableConfig}
          draggable={draggable}
          draggableConfig={draggableConfig}
          destroyOnClose={destroyOnClose}
        >
          {modalBody}
        </Modal>
      </>
    );
  },
);

export default ModalTrigger;
