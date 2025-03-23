import React from 'react';
import { Block } from 'react-login-page';

export const Logo = (props) => {
  const { keyname = 'logo', name, ...elmProps } = props;
  if (!elmProps.children) {
    elmProps.children = '⚛️';
  }
  const nameBase = name || keyname;
  return <Block {...elmProps} keyname={nameBase} className={`login-page8-logo ${elmProps.className || ''}`} />;
};

Logo.displayName = 'Login.Logo';