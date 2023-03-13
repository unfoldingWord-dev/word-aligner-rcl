import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { default as WordLexiconDetails } from 'tc-ui-toolkit/lib/WordLexiconDetails/index';
import * as lexiconHelpers from 'tc-ui-toolkit/lib/ScripturePane/helpers/lexiconHelpers';
import * as types from '../common/WordCardTypes';
// components
import Word from './WordCard';

const internalStyle = {
  word: {
    color: '#ffffff',
    backgroundColor: '#333333',
  },
};

/**
 * Renders a draggable primary word
 * @see WordCard
 *
 * @property wordObject
 * @property style
 * @property resourcesReducer
 *
 */
class PrimaryToken extends Component {
  constructor(props) {
    super(props);
    this._handleClick = this._handleClick.bind(this);
    this._handleOut = this._handleOut.bind(this);
    this._handleOver = this._handleOver.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.state = {
      hover: false,
      anchorEl: null,
    };
  }

  /**
   * called when drag is initialized
   */
  onDragStart(e) {
    const {
      selectedTokens,
      token,
      setDragToken,
      onClick,
      // connectDragPreview,
    } = this.props;

    // const hasSelections = selectedTokens && selectedTokens.length > 0;

    const token_ = {
      ...token,
      type: types.PRIMARY_WORD,
      alignmentIndex: this.props.alignmentIndex,
      alignmentLength: this.props.alignmentLength,
    };
    setDragToken && setDragToken(token_, false);
  }

  /**
   * called when drag is finished
   * @param e
   */
  onDragEnd(e) {
    this.props.setDragToken && this.props.setDragToken(null, true);
  }

  /**
   * Enables hover state
   * @private
   */
  _handleOver(e) {
    this.setState({
      hover: true,
      anchorEl: e.currentTarget,
    });
  }

  /**
   * Disables hover state
   * @private
   */
  _handleOut() {
    this.setState({
      hover: false,
      anchorEl: null,
    });
  }

  render() {
    const {
      token,
      style,
      canDrag,
      fontSize,
      isHebrew,
      direction,
      isDragging,
      setDragToken,
    } = this.props;
    const { hover } = this.state;

    const disabled = (isDragging || hover) && !canDrag;
    const word = (
      <div>
        <Word
          word={token.text}
          disabled={disabled}
          fontSize={fontSize}
          isHebrew={isHebrew}
          direction={direction}
          occurrence={token.occurrence}
          occurrences={token.occurrences}
          style={{ ...internalStyle.word, ...style }}
          onDragStart={this.onDragStart}
          onDragEnd={this.onDragEnd}
        />
      </div>
    );
    return (
      <div style={{ flex: 1, position: 'relative' }}
        onClick={this._handleClick}
        onMouseOver={this._handleOver}
        onMouseOut={this._handleOut}>
        {word}
      </div>
    );
  }

  /**
   * Handles clicks on the word
   * @param e - the click event
   * @private
   */
  _handleClick(e) {
    const {
      translate, token, isHebrew, showPopover,
    } = this.props;
    const lexiconData = lexiconHelpers.lookupStrongsNumbers(token.strong, this.props.loadLexiconEntry);
    const positionCoord = e.target;
    const fontSize = isHebrew ? '1.7em' : '1.2em';
    const PopoverTitle = (
      <strong style={{ fontSize }}>{token.text}</strong>
    );
    const wordDetails = (
      <WordLexiconDetails lexiconData={lexiconData} wordObject={token} translate={translate}
        isHebrew={isHebrew}/>
    );
    const rawData = {
      token,
      lexiconData,
    }
    showPopover(PopoverTitle, wordDetails, positionCoord, rawData);
  }
}

PrimaryToken.defaultProps = {
  alignmentLength: 1,
  canDrag: true,
  direction: 'ltr',
  isDragging: false,
  style: {},
  wordIndex: 0,
};

PrimaryToken.propTypes = {
  fontSize: PropTypes.number,
  translate: PropTypes.func.isRequired,
  wordIndex: PropTypes.number,
  alignmentLength: PropTypes.number,
  canDrag: PropTypes.bool,
  token: PropTypes.object,
  style: PropTypes.object,
  lexicons: PropTypes.object.isRequired,
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  isDragging: PropTypes.bool.isRequired,
  setDragToken: PropTypes.func.isRequired,
  isHebrew: PropTypes.bool.isRequired,
  showPopover: PropTypes.func.isRequired,
  loadLexiconEntry: PropTypes.func.isRequired,
};

export default PrimaryToken;
