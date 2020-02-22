/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const {html} = require("common-tags");
const md = require("markdown-it")();
const mdBlock = require("../../_filters/md-block");

function headerTemplate(assessment) {
  if (assessment.setLeader && assessment.questions.length > 1) {
    return html`
      <div class="w-callout__blurb web-assessment__set-leader">
        ${assessment.setLeader}
      </div>
    `;
  }
}

/* eslint-disable indent */
function contentTemplate(assessment) {
  if (assessment.questions.length > 1) {
    return html`
      <web-tabs
        class="web-assessment__content"
        label="${assessment.tabLabel}s for knowledge self check"
      >
        ${assessment.questions.map((question) => {
          return tabTemplate(question, assessment);
        })}
      </web-tabs>
    `;
  } else {
    return html`
      <div class="web-assessment__content">
        ${assessment.questions.map(questionTemplate)}
      </div>
    `;
  }
}
/* eslint-enable indent */

function tabTemplate(question, assessment) {
  return html`
    <div
      class="web-tabs__panel"
      role="tabpanel"
      data-label="${assessment.tabLabel}"
      hidden
    >
      ${questionTemplate(question)}
    </div>
  `;
}

function questionTemplate(question) {
  const stimulus = question.stimulus
    ? html`
        <div data-role="stimulus">${mdBlock(question.stimulus)}</div>
      `
    : "";
  return html`
    <web-question>
      ${stimulus} ${responsesTemplate(question)}
    </web-question>
  `;
}

/* If a question has no components,
 * get the response component from the question object itself.
 * If a question DOES have components,
 * get the response components from the question's components object.
 */
function responsesTemplate(question) {
  if (!question.components) return responseTemplate(question);
  return question.components.map(responseTemplate);
}

function responseTemplate(response) {
  if (!response.type) {
    throw new Error(`
      Can't create a self-assessment response component without a type argument.
      Check that all response component objects in your assessment's *.assess.js file
      include a type key.
    `);
  }

  if (
    response.cardinality &&
    !/^\d+$/.test(response.cardinality) &&
    !/^\d+\+$/.test(response.cardinality) &&
    !/^\d-\d+$/.test(response.cardinality)
  ) {
    throw new Error(`
      The cardinality value for self-assessment response components must be n, n+, or n-m.
      Check your assessment's *.assess.js file for invalid cardinality values.
    `);
  }

  if (response.correctAnswers && !/^\d(,\d)*$/.test(response.correctAnswers)) {
    throw new Error(`
      The correctAnswers value for self-assessment response components
      must be a comma-separated list of positive integers.
      Check your assessment's *.assess.js file for invalid correctAnswer values.
    `);
  }

  if (
    response.columns &&
    response.columns != true &&
    response.columns != false
  ) {
    throw new Error(`
      The columns value for self-assessment response components must be true or false.
      Check your assessment's *.assess.js file for invalid columns values.
    `);
  }

  let typeSuffix = "";

  switch (response.type) {
    case "think-and-check":
      typeSuffix = "-tac";
      break;
    case "multiple-choice":
      typeSuffix = "-mc";
      break;
    default:
      throw new Error(`
        Unrecognized self-assessment question response type.
        Check your assessment's *.assess.js file for invalid type values.
      `);
  }

  const cardinalityAttr = response.cardinality
    ? "cardinality=" + response.cardinality
    : "";
  const correctAnswersAttr = response.correctAnswers
    ? "correct-answer=" + response.correctAnswers
    : "";
  const columnsAttr = response.columns ? "columns" : "";

  return html`
    <web-response${typeSuffix} ${cardinalityAttr} ${correctAnswersAttr} ${columnsAttr} class="web-response">
      <p>${md.renderInline(response.stem)}</p>
      ${response.options.map(optionContentTemplate)}
      ${response.options.map(rationaleTemplate)}
    </web-response${typeSuffix}>
  `;
}

function optionContentTemplate(option) {
  if (!option.content) return;
  return html`
    <span data-role="option">
      ${md.renderInline(option.content)}
    </span>
  `;
}

function rationaleTemplate(option) {
  if (!option.rationale) return;
  return html`
    <div data-role="rationale">
      ${md.render(option.rationale)}
    </div>
  `;
}

module.exports = (page, targetAssessment) => {
  if (!page) {
    throw new Error(
      `Can't create Assessment component without the page argument.`,
    );
  }

  if (!targetAssessment) {
    throw new Error(`
      Can't create Assessment component without a target assessment.
      Pass the file name, without ".assess.js", of the desired assessment as a string.
    `);
  }

  const path = page.filePathStem.replace(/index$/, "");
  const source = require("../../content" +
    path +
    targetAssessment +
    ".assess.js");
  const assessment = source.assessment;
  const height = assessment.height
    ? "style=height:" + assessment.height + ";"
    : "";

  // prettier-ignore
  return html`
    <web-assessment ${height} class="w-callout ${assessment.questions.length === 1 && "web-assessment--singleton"}" aria-label="Check your understanding">
      ${headerTemplate(assessment)} ${contentTemplate(assessment)}
    </web-assessment>
  `;
};