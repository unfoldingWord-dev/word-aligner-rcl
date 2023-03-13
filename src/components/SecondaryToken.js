import React from 'react';
import PropTypes from 'prop-types';
// load drag preview images
import * as types from '../common/WordCardTypes';
import Word from './WordCard';

/**
 * Checks if a token exists within the list
 * @param {object[]} list - an array of tokens
 * @param {object} token - a single token
 * @return {boolean} - true if the token exists within the list
 */
function containsToken(list, token) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].index === token.index) {
      return true;
    }
  }
}

/**
 * Renders a draggable secondary word.
 *
 * @see WordCard
 *
 * @property {string} word - the represented word
 * @property {int} occurrence
 * @property {int} occurrences
 */
class SecondaryToken extends React.Component {
  constructor(props) {
    super(props);
    this.handleCancel = this.handleCancel.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  handleCancel() {
    const { onCancel, token } = this.props;

    if (typeof onCancel === 'function') {
      onCancel(token);
    }
  }

  handleClick(e) {
    e.stopPropagation();
    const {
      token, onClick,
    } = this.props;

    if (!token.disabled && onClick) {
      const buttonDiv = e.currentTarget.getElementsByTagName('DIV')[0].getElementsByTagName('DIV')[0];
      buttonDiv.style.cursor = 'wait';
      setTimeout(() => {
        if (buttonDiv) {
          buttonDiv.style.cursor = 'pointer';
        }
      }, 1000);
      onClick(token);
    }
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
    } = this.props;

    const token_ = {
      ...token,
      type: types.SECONDARY_WORD,
      alignmentIndex: this.props.alignmentIndex,
    };
    setDragToken && setDragToken(token_, false);

    let tokens = [];

    if (selectedTokens) {
      tokens = [...selectedTokens];

      // TRICKY: include the dragged token in the selection
      if (!containsToken(tokens, token)) {
        tokens.push(token);

        // select the token so it's renders with the selections
        if (onClick && selectedTokens.length > 0) {
          onClick(token);
        }
      }
    } else {
      // TRICKY: always populate tokens.
      tokens.push(token);
    }
  }

  /**
   * called when drag is finished
   * @param e
   */
  onDragEnd(e) {
    this.props.setDragToken && this.props.setDragToken(null, true);
  }

  render() {
    const {
      token,
      disabled,
      selected,
      direction,
      isDragging,
      targetLanguageFontClassName,
      fontScale
    } = this.props;
    const opacity = isDragging ? 0.4 : 1;

    const wordComponent = (
      <div
        style={{ flex: 1 }}
        onClick={this.handleClick}
      >
        <Word
          word={token.text}
          style={{ opacity }}
          fontScale={fontScale}
          selected={selected}
          disabled={disabled}
          direction={direction}
          disableTooltip={isDragging || disabled}
          onCancel={this.handleCancel}
          occurrence={token.occurrence}
          occurrences={token.occurrences}
          targetLanguageFontClassName={targetLanguageFontClassName}
          onDragStart={this.onDragStart}
          onDragEnd={this.onDragEnd}
        />
      </div>
    );

    if (disabled) {
      return wordComponent;
    } else {
      // return connectDragSource(wordComponent);
      return wordComponent;
    }
  }
}

SecondaryToken.propTypes = {
  selected: PropTypes.bool,
  selectedTokens: PropTypes.array,
  onEndDrag: PropTypes.func,
  onClick: PropTypes.func,
  onCancel: PropTypes.func,
  onAccept: PropTypes.func,
  token: PropTypes.object.isRequired,
  dragToken: PropTypes.object,
  setDragToken: PropTypes.func.isRequired,
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  disabled: PropTypes.bool,
  targetLanguageFontClassName: PropTypes.string,
  fontScale: PropTypes.number
};

SecondaryToken.defaultProps = {
  isSelected: false,
  onClick: () => {
  },
  onAccept: () => {
  },
  disabled: false,
  fontScale: 100,
  selectedTokens: [],
  direction: 'ltr',
};

/**
 * Handles drag events on the word
 */
const dragHandler = {
  beginDrag(props) {
    // Return the data describing the dragged item
    const {
      token, onClick, selectedTokens,
    } = props;
    token.type = types.SECONDARY_WORD;
    let tokens = [];

    if (selectedTokens) {
      tokens = [...selectedTokens];

      // TRICKY: include the dragged token in the selection
      if (!containsToken(tokens, token)) {
        tokens.push(token);

        // select the token so it's renders with the selections
        if (onClick && selectedTokens.length > 0) {
          onClick(token);
        }
      }
    } else {
      // TRICKY: always populate tokens.
      tokens.push(token);
    }
    return {
      tokens,
      token: props.token,
      alignmentIndex: props.alignmentIndex,
      type: types.SECONDARY_WORD,
    };
  },
  endDrag(props, monitor) {
    const dropResult = monitor.getDropResult();

    if (monitor.didDrop() && dropResult && typeof props.onEndDrag === 'function') {
      props.onEndDrag();
    }
  },
  isDragging(props, monitor) {
    const item = monitor.getItem();
    return item.token.index === props.token.index;
  },
};

export default SecondaryToken;
