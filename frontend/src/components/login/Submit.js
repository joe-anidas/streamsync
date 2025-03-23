import React from 'react';
import { Button } from 'react-login-page';

export const Submit = (props) => {
  const { keyname = 'submit', panel = 'login', ...elmProps } = props;
  const panelName = panel;
  if (!elmProps.children) {
    elmProps.children = 'Submit';
  }
  return <Button type="submit" {...elmProps} keyname={`$$${panelName}${keyname}`} />;
};

Submit.displayName = 'Login.Submit';