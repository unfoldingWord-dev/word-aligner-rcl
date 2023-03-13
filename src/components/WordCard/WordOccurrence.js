import React from 'react';
import PropTypes from 'prop-types';

const regularHebrewStyles = {
  top: 0,
  opacity: '0.8',
  marginTop: '5.5px',
  paddingLeft: '4px',
  lineHeight: '0px',
};

const largeHebrewStyles = {
  top: 7,
  opacity: '0.8',
  marginTop: '5px',
  marginRight: '10px',
  padding: '2px 0px 0px 0px 4px',
  lineHeight: '0px',
};

const regularGreekStyles = {
  top: '0px',
  opacity: '0.8',
  paddingLeft: '4px',
  lineHeight: '0px',
};

const largeGreekStyles = {
  top: '0px',
  opacity: '0.8',
  padding: '2px 0px 0px 4px',
  lineHeight: '0px',
};

/**
 * Renders a words occurrence.
 * This is rendered as a superscript.
 * @param {int} occurrence - the order in which this word occurs (1 indexed).
 * @param {int} occurrences - how many times this word occurs in the context
 * @param {object} [style] - overrides the default styles
 * @return {*}
 * @constructor
 */
const WordOccurrence = ({
  style,
  fontSize,
  isHebrew,
  occurrence,
  occurrences,
}) => {
  let styles = {};

  if (isHebrew) {
    styles = fontSize <= 100 ? regularHebrewStyles : largeHebrewStyles;
  } else { // is Greek
    styles = fontSize <= 100 ? regularGreekStyles : largeGreekStyles;
  }

  const computedStyles = {
    ...styles,
    ...style
  };

  if (occurrences > 1) {
    return <sup style={computedStyles}>{occurrence}</sup>;
  } else {
    return null;
  }
};

WordOccurrence.propTypes = {
  style: PropTypes.object,
  isHebrew: PropTypes.bool,
  fontSize: PropTypes.number,
  occurrence: PropTypes.number.isRequired,
  occurrences: PropTypes.number.isRequired,
};

export default WordOccurrence;
