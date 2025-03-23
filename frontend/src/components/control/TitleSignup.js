import React from 'react';
import { Block } from 'react-login-page';

export const TitleSignup = (props) => {
  const { keyname = 'title-signup', name, ...elmProps } = props;
  if (!elmProps.children) {
    elmProps.children = 'Signup';
  }
  const nameBase = name || keyname;
  return <Block {...elmProps} keyname={nameBase} />;
};

TitleSignup.displayName = 'Login.TitleSignup';