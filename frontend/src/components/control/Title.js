import React from 'react';
import { Block } from 'react-login-page';

export const Title = (props) => {
  const { keyname = 'title', name, ...elmProps } = props;
  if (!elmProps.children) {
    elmProps.children = 'Login';
  }
  const nameBase = name || keyname;
  return <Block {...elmProps} keyname={nameBase} />;
};

Title.displayName = 'Login.Title';