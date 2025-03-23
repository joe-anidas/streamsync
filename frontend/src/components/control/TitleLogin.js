import React from 'react';
import { Block } from 'react-login-page';

export const TitleLogin = (props) => {
  const { keyname = 'title-login', name, ...elmProps } = props;
  if (!elmProps.children) {
    elmProps.children = 'Login';
  }
  const nameBase = name || keyname;
  return <Block {...elmProps} keyname={nameBase} />;
};

TitleLogin.displayName = 'Login.TitleLogin';