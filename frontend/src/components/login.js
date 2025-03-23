import React, { cloneElement, forwardRef, isValidElement, useState } from 'react';
import { Render, Provider, Container, useStore } from 'react-login-page';
import { Username } from './login/Username';
import { Password } from './login/Password';
import { Submit } from './login/Submit';
import { Footer } from './control/Footer';
import { Logo } from './control/Logo';
import { Title } from './control/Title';
import { TitleLogin } from './control/TitleLogin';
import { TitleSignup } from './control/TitleSignup';

import './css/login.css';

export * from 'react-login-page';
export * from './login/Username';
export * from './login/Password';
export * from './login/Submit';
export * from './control/Title';
export * from './control/TitleLogin';
export * from './control/TitleSignup';
export * from './control/Logo';
export * from './control/Footer';

const RenderLogin = () => {
  const { blocks = {}, extra = {}, data, ...label } = useStore();
  const { fields, buttons } = data || { fields: [] };
  const [panel, setPanel] = useState('login');
  const loginButtons = buttons.filter((m) => m.name.indexOf('$$login') > -1).sort((a, b) => a.index - b.index);
  const loginFields = fields.filter((m) => m.name.indexOf('$$login') > -1).sort((a, b) => a.index - b.index);
  const signupButtons = buttons.filter((m) => m.name.indexOf('$$signup') > -1).sort((a, b) => a.index - b.index);
  const signupFields = fields.filter((m) => m.name.indexOf('$$signup') > -1).sort((a, b) => a.index - b.index);
  return (
    <Render>
      <div className="login-page8-inner">
        <header>
          {blocks.logo}
          {blocks.title}
        </header>
        <main>
          <article className={panel === 'login' ? 'active' : ''}>
            <button onClick={() => setPanel('login')}>{blocks['title-login']}</button>
            <section className="login-page8-fields login-page8-login">
              {loginFields.map((item, idx) => {
                const extraLabel = extra[item.name];
                if (!item.children && !extraLabel) return null;
                if (!item.children && extraLabel) return <div key={idx}>{extraLabel}</div>;
                if (!item.children) return null;
                const labelElement = label[item.name];
                const htmlFor = item.name.replace('$$login', '');
                const { name, ...props } = item.children.props;
                return (
                  <label className={`rlp-${item.name}`} htmlFor={htmlFor} key={item.name + idx}>
                    {labelElement && <span className="login-page8-label">{labelElement}</span>}
                    {cloneElement(item.children, {
                      ...props,
                      name: panel === 'login' ? name : '',
                      key: item.name + idx,
                    })}
                    {extraLabel && <div>{extraLabel}</div>}
                  </label>
                );
              })}
              <section className="login-page8-button">
                {loginButtons.map((item, idx) => {
                  const child = item.children;
                  if (!isValidElement(child)) return null;
                  return cloneElement(child, {
                    ...child.props,
                    key: item.name + idx,
                  });
                })}
              </section>
            </section>
          </article>
          <article className={panel === 'signup' ? 'active' : ''}>
            <button onClick={() => setPanel('signup')}>{blocks['title-signup']}</button>
            <section className="login-page8-fields login-page8-signup">
              {signupFields.map((item, idx) => {
                const extraLabel = extra[item.name];
                if (!item.children && !extraLabel) return null;
                if (!item.children && extraLabel) return <div key={idx}>{extraLabel}</div>;
                if (!item.children) return null;
                const labelElement = label[item.name];
                const htmlFor = item.name.replace('$$signup', '');
                const { name, ...props } = item.children.props;
                return (
                  <label htmlFor={htmlFor} key={item.name + idx}>
                    {labelElement && <span className="login-page8-label">{labelElement}</span>}
                    {cloneElement(item.children, {
                      ...props,
                      name: panel === 'signup' ? name : '',
                      key: item.name + idx,
                    })}
                    {extraLabel && <div>{extraLabel}</div>}
                  </label>
                );
              })}
              <section className="login-page8-button">
                {signupButtons.map((item, idx) => {
                  const child = item.children;
                  if (!isValidElement(child)) return null;
                  return cloneElement(child, {
                    ...child.props,
                    key: item.name + idx,
                  });
                })}
              </section>
            </section>
          </article>
        </main>
        {blocks.footer}
      </div>
    </Render>
  );
};

const LoginPage = forwardRef((props, ref) => {
  const { children, className, ...divProps } = props;
  return (
    <Provider>
      <Title />
      <TitleSignup />
      <TitleLogin />
      <Logo />
      <Username />
      <Password />
      <Submit />

      <Username panel="signup" label="E-mail" type="email" placeholder="E-mail" keyname="e-mail" />
      <Password panel="signup" label="Password" placeholder="Password" keyname="password" />
      <Password panel="signup" label="Confirm Password" placeholder="Confirm Password" keyname="confirm-password" />
      <Submit keyname="signup-submit" panel="signup">
        Signup
      </Submit>
      <Container {...divProps} className={`login-page8 ${className || ''}`}>
        <RenderLogin />
        {children}
      </Container>
    </Provider>
  );
});

const Login = LoginPage;

Login.Username = Username;
Login.Password = Password;
Login.Submit = Submit;
Login.Footer = Footer;
Login.Logo = Logo;
Login.Title = Title;
Login.TitleLogin = TitleLogin;
Login.TitleSignup = TitleSignup;
Login.displayName = 'BaseLoginPage';

export default Login;