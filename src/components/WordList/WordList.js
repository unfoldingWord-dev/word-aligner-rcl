import React from 'react';
import PropTypes from 'prop-types';
import * as types from '../../common/WordCardTypes';
import SecondaryToken from '../SecondaryToken';
import {getFontClassName} from '../../common/fontUtils';

/**
 * Renders a list of words that need to be aligned.
 * Previously known as the "WordBank".
 * @param {function} onWordDragged - executed when a word is dragged and dropped away from the word list
 * @param {number[]} selectedWordPositions - an array of words that are selected
 * @param {object[]} selectedWords - an array of words that are selected
 * @param {function} onWordClick - called when a word in the list is clicked
 * @param {Token[]} words,
 * @return {*}
 * @constructor
 */
class WordList extends React.Component {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
    this.isSelected = this.isSelected.bind(this);
    this.state = {
      width: 0,
      height: 0,
    };
  }

  /**
   * Checks if the token is selected
   * @param token
   * @return {boolean}
   */
  isSelected(token) {
    const { selectedWordPositions } = this.props;

    return selectedWordPositions &&
      selectedWordPositions.indexOf(token.index) !== -1;
  }

  // eslint-disable-next-line no-unused-vars
  getSnapshotBeforeUpdate(prevProps, prevState) {
    if (!prevState.isOver && this.listRef.current) {
      return {
        height: this.listRef.current.scrollHeight,
        width: this.listRef.current.clientWidth,
      };
    } else {
      return {
        height: 0,
        width: 0,
      };
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const notZero = snapshot.width !== 0 && snapshot.height !== 0;
    const changed = snapshot.width !== this.state.width || snapshot.height !== this.state.height;

    if (notZero && changed) {
      this.setState(snapshot);
    }

    if (this.props.reset && (prevProps.reset !== this.props.reset)) {
      this.setState({canDrop: false});
      console.log(`WordList.componentDidUpdate()- reset`);
    }
  }

  render() {
    const {
      words,
      direction,
      onWordClick,
      selectedWords,
      toolSettings,
      targetLanguageFont,
      dragToken,
      setDragToken,
      isOver,
    } = this.props;
    const { width, height } = this.state;

    if (isOver) {
      return (
        <div
          style={{
            border: '3px dashed #44C6FF',
            height: `${height}px`,
            width: `${width}px`,
          }}/>
      );
    } else {
      const targetLanguageFontClassName = getFontClassName(targetLanguageFont);
      // const isRtl = direction === 'rtl';

      return (
        <React.Fragment>
          <div ref={this.listRef}
            style={{ height: '100%' }}
          >
            <div style={{
              display: 'flex', justifyContent: 'flex-end', padding: '0px 5px 5px',
            }}>
            </div>
            {words.map((token, index) => (
              <div
                key={index}
                style={{ padding: '5px 10px' }}>
                <SecondaryToken
                  token={token}
                  fontScale={toolSettings.fontSize}
                  onClick={onWordClick}
                  direction={direction}
                  selectedTokens={selectedWords}
                  selected={this.isSelected(token)}
                  disabled={token.disabled === true}
                  targetLanguageFontClassName={targetLanguageFontClassName}
                  dragToken={dragToken}
                  setDragToken={setDragToken}
                />
              </div>
            ))}
          </div>
        </React.Fragment>
      );
    }
  }
}

WordList.propTypes = {
  onWordClick: PropTypes.func,
  selectedWords: PropTypes.array,
  targetLanguageFont: PropTypes.string,
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  toolsSettings: PropTypes.object.isRequired,
  setToolSettings: PropTypes.func.isRequired,
  dragToken: PropTypes.oneOf([PropTypes.object, PropTypes.array]),
  setDragToken: PropTypes.func.isRequired,
  toolSettings: PropTypes.object.isRequired,
  selectedWordPositions: PropTypes.arrayOf(PropTypes.number),
  words: PropTypes.arrayOf(PropTypes.object).isRequired,
  reset: PropTypes.bool.isRequired,
  isOver: PropTypes.bool.isRequired,
};

WordList.defaultProps = {
  direction: 'ltr',
  toolSettings: {
    fontSize: 100
  }
};

export default WordList;
