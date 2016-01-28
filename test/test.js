'use strict';

const expect    = require ('chai').expect;
const babelCore = require ('babel-core');

const opts = {
  presets: ['es2015', 'react', 'stage-0'],
  plugins: [
    ['./index.js']
  ]
};

const JSX = `
'use strict';
import {T} from 'react-nabu';

export default class NabuTest extends Component {
  render () {
    return (
      <div>
        <T msgid="First text to translate" desc="Description for translator" />
        <TextField
          {...email}
          ref="firstField"
          style={{width:'100%'}}
          defaultValue={login}
          hintText={login ? "" : <T msgid="Your email address" />}
          floatingLabelText={<T msgid="Email" />}
          type="email" />
        <TextField
          {...password}
          style={{width:'100%'}}
          ref="secondField"
          hintText={<T msgid="Your password" />}
          floatingLabelText={<T msgid="Password" />}
          type="password"
          onEnterKeyDown={handleSubmit} />
      </div>
    )
  }
}
`;

describe ('babel-nabu-plugin', () => {
  describe ('#extract ()', () => {
    it ('Should return a result', () => {
      const res = babelCore.transform (JSX, opts);

      expect (res.metadata['react-nabu'].messages).to.have.length (5);

      expect (res.metadata['react-nabu'].messages[0].msgid.value).to.be.equal ('First text to translate');
      expect (res.metadata['react-nabu'].messages[1].msgid.value).to.be.equal ('Your email address');
      expect (res.metadata['react-nabu'].messages[2].msgid.value).to.be.equal ('Email');
      expect (res.metadata['react-nabu'].messages[3].msgid.value).to.be.equal ('Your password');
      expect (res.metadata['react-nabu'].messages[4].msgid.value).to.be.equal ('Password');
    });
  });
});
