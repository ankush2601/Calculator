
/* =========================================================
   SCIENTIFIC CALCULATOR & EXPRESSION STUDIO
   Complete JavaScript Implementation
   ========================================================= */


/* =========================================================
   1. DOM ELEMENTS
   ========================================================= */

const display = document.getElementById("display");
const resultDisplay = document.getElementById("result");

const modeBtn = document.getElementById("modeBtn");

const clearBtn = document.getElementById("clearBtn");
const backspaceBtn = document.getElementById("backspaceBtn");
const equalBtn = document.getElementById("equalBtn");

const saveFunctionBtn = document.getElementById("saveFunctionBtn");

const functionNameInput = document.getElementById("functionName");
const functionParameterInput = document.getElementById("functionParameter");
const functionExpressionInput = document.getElementById("functionExpression");

const functionList = document.getElementById("functionList");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const graphExpression = document.getElementById("graphExpression");
const graphScale = document.getElementById("graphScale");
const plotBtn = document.getElementById("plotBtn");

const canvas = document.getElementById("graphCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;


/* =========================================================
   2. APPLICATION STATE
   ========================================================= */

let angleMode = "DEG";

function loadStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error("Storage error:", error);
        return fallback;
    }
}

let history = loadStorage("calculatorHistory", []);
let customFunctions = loadStorage("customFunctions", {});

if (!Array.isArray(history)) {
    history = [];
}

if (
    customFunctions === null ||
    typeof customFunctions !== "object" ||
    Array.isArray(customFunctions)
) {
    customFunctions = {};
}


/* =========================================================
   3. STORAGE HELPER
   ========================================================= */

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Unable to save data:", error);
    }
}


/* =========================================================
   4. CALCULATOR BUTTON INPUT
   ========================================================= */

document.querySelectorAll("[data-value]").forEach(button => {

    button.addEventListener("click", () => {

        display.value += button.dataset.value;
        display.focus();

    });

});


/* =========================================================
   5. DEG / RAD MODE
   ========================================================= */

if (modeBtn) {

    modeBtn.addEventListener("click", () => {

        angleMode = angleMode === "DEG" ? "RAD" : "DEG";

        modeBtn.textContent = angleMode;

    });

}


/* =========================================================
   6. CLEAR BUTTON
   ========================================================= */

if (clearBtn) {

    clearBtn.addEventListener("click", () => {

        display.value = "";
        resultDisplay.textContent = "0";

        display.focus();

    });

}


/* =========================================================
   7. BACKSPACE BUTTON
   ========================================================= */

if (backspaceBtn) {

    backspaceBtn.addEventListener("click", () => {

        display.value = display.value.slice(0, -1);

        display.focus();

    });

}


/* =========================================================
   8. TOKENIZER
   ========================================================= */

function tokenize(expression) {

    expression = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/\s+/g, "");

    const tokens = [];

    let i = 0;

    while (i < expression.length) {

        const char = expression[i];

        // NUMBER

        if (/[0-9.]/.test(char)) {

            let number = "";

            while (
                i < expression.length &&
                /[0-9.]/.test(expression[i])
            ) {

                number += expression[i];
                i++;

            }

            if (
                (number.match(/\./g) || []).length > 1 ||
                number === "."
            ) {

                throw new Error("Invalid number");

            }

            tokens.push(number);
            continue;

        }


        // IDENTIFIER / FUNCTION

        if (/[a-zA-Z_]/.test(char)) {

            let name = "";

            while (
                i < expression.length &&
                /[a-zA-Z0-9_]/.test(expression[i])
            ) {

                name += expression[i];
                i++;

            }

            tokens.push(name.toLowerCase());
            continue;

        }


        // OPERATORS AND PARENTHESES

        if ("+-*/^(),".includes(char)) {

            tokens.push(char);
            i++;

            continue;

        }

        throw new Error("Invalid character: " + char);

    }

    return tokens;

}


/* =========================================================
   9. OPERATORS AND PRECEDENCE
   ========================================================= */

const precedence = {

    "+": 1,
    "-": 1,

    "*": 2,
    "/": 2,

    "u+": 3,
    "u-": 3,

    "^": 4

};


function isOperator(token) {

    return Object.prototype.hasOwnProperty.call(
        precedence,
        token
    );

}


function isRightAssociative(operator) {

    return operator === "^" ||
           operator === "u-" ||
           operator === "u+";

}


/* =========================================================
   10. IDENTIFIER CHECK
   ========================================================= */

function isIdentifier(token) {

    return (
        typeof token === "string" &&
        /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)
    );

}


/* =========================================================
   11. INFIX TO POSTFIX
   SHUNTING YARD ALGORITHM
   ========================================================= */

function infixToPostfix(tokens) {

    const output = [];
    const stack = [];

    let expectOperand = true;

    for (let i = 0; i < tokens.length; i++) {

        const token = tokens[i];


        // NUMBER

        if (!Number.isNaN(Number(token)) && token !== "") {

            if (!expectOperand) {
                throw new Error("Missing operator");
            }

            output.push(token);
            expectOperand = false;

            continue;

        }


        // IDENTIFIER / FUNCTION

        if (isIdentifier(token)) {

            if (!expectOperand) {
                throw new Error("Missing operator");
            }

            if (tokens[i + 1] === "(") {

                stack.push(token);

            } else {

                output.push(token);
                expectOperand = false;

            }

            continue;

        }


        // OPEN PARENTHESIS

        if (token === "(") {

            if (!expectOperand) {
                throw new Error("Missing operator");
            }

            stack.push(token);

            expectOperand = true;

            continue;

        }


        // CLOSE PARENTHESIS

        if (token === ")") {

            if (expectOperand) {
                throw new Error("Invalid expression");
            }

            while (
                stack.length > 0 &&
                stack[stack.length - 1] !== "("
            ) {

                output.push(stack.pop());

            }

            if (stack.length === 0) {
                throw new Error("Mismatched parentheses");
            }

            stack.pop();

            // If a function is present before (

            if (
                stack.length > 0 &&
                isIdentifier(stack[stack.length - 1])
            ) {

                output.push(stack.pop());

            }

            expectOperand = false;

            continue;

        }


        // FUNCTION ARGUMENT SEPARATOR

        if (token === ",") {

            throw new Error(
                "Only single-argument functions are supported"
            );

        }


        // OPERATORS

        if (isOperator(token)) {

            let operator = token;

            // Unary plus and minus

            if (expectOperand) {

                if (token === "+") {
                    operator = "u+";
                } else if (token === "-") {
                    operator = "u-";
                } else {
                    throw new Error("Invalid operator placement");
                }

            } else {

                expectOperand = true;

            }


            while (
                stack.length > 0 &&
                isOperator(stack[stack.length - 1]) &&
                (
                    precedence[stack[stack.length - 1]] >
                    precedence[operator] ||

                    (
                        precedence[stack[stack.length - 1]] ===
                        precedence[operator] &&
                        !isRightAssociative(operator)
                    )
                )
            ) {

                output.push(stack.pop());

            }

            stack.push(operator);

            continue;

        }


        throw new Error("Invalid token: " + token);

    }


    if (expectOperand) {
        throw new Error("Incomplete expression");
    }


    // EMPTY STACK

    while (stack.length > 0) {

        const token = stack.pop();

        if (token === "(") {
            throw new Error("Mismatched parentheses");
        }

        output.push(token);

    }

    return output;

}


/* =========================================================
   12. DEGREE TO RADIAN
   ========================================================= */

function toRadians(value) {

    return value * Math.PI / 180;

}


/* =========================================================
   13. SCIENTIFIC FUNCTIONS
   ========================================================= */

const scientificFunctions = {

    sin(value) {

        return Math.sin(
            angleMode === "DEG" ? toRadians(value) : value
        );

    },

    cos(value) {

        return Math.cos(
            angleMode === "DEG" ? toRadians(value) : value
        );

    },

    tan(value) {

        return Math.tan(
            angleMode === "DEG" ? toRadians(value) : value
        );

    },

    sqrt(value) {

        if (value < 0) {
            throw new Error("Square root of negative number");
        }

        return Math.sqrt(value);

    },

    log(value) {

        if (value <= 0) {
            throw new Error("Invalid logarithm value");
        }

        return Math.log10(value);

    },

    ln(value) {

        if (value <= 0) {
            throw new Error("Invalid logarithm value");
        }

        return Math.log(value);

    },

    abs(value) {

        return Math.abs(value);

    }

};


/* =========================================================
   14. CONSTANTS
   ========================================================= */

const constants = {

    pi: Math.PI,
    e: Math.E

};


/* =========================================================
   15. EVALUATE POSTFIX
   ========================================================= */

function evaluatePostfix(postfix, variables = {}, depth = 0) {

    if (depth > 20) {
        throw new Error("Maximum function recursion exceeded");
    }

    const stack = [];


    for (const token of postfix) {


        // NUMBER

        if (!Number.isNaN(Number(token)) && token !== "") {

            stack.push(Number(token));
            continue;

        }


        // UNARY OPERATORS

        if (token === "u-" || token === "u+") {

            if (stack.length < 1) {
                throw new Error("Invalid unary expression");
            }

            const value = stack.pop();

            stack.push(
                token === "u-" ? -value : value
            );

            continue;

        }


        // BINARY OPERATORS

        if (isOperator(token)) {

            if (stack.length < 2) {
                throw new Error("Invalid expression");
            }

            const b = stack.pop();
            const a = stack.pop();

            let result;

            switch (token) {

                case "+":
                    result = a + b;
                    break;

                case "-":
                    result = a - b;
                    break;

                case "*":
                    result = a * b;
                    break;

                case "/":

                    if (b === 0) {
                        throw new Error("Cannot divide by zero");
                    }

                    result = a / b;
                    break;

                case "^":
                    result = Math.pow(a, b);
                    break;

            }

            if (!Number.isFinite(result)) {
                throw new Error("Invalid mathematical result");
            }

            stack.push(result);

            continue;

        }


        // CONSTANTS

        if (Object.prototype.hasOwnProperty.call(constants, token)) {

            stack.push(constants[token]);
            continue;

        }


        // VARIABLES

        if (Object.prototype.hasOwnProperty.call(variables, token)) {

            stack.push(variables[token]);
            continue;

        }


        // SCIENTIFIC FUNCTIONS

        if (
            Object.prototype.hasOwnProperty.call(
                scientificFunctions,
                token
            )
        ) {

            if (stack.length < 1) {
                throw new Error("Invalid function input");
            }

            const value = stack.pop();

            const result = scientificFunctions[token](value);

            if (!Number.isFinite(result)) {
                throw new Error("Invalid function result");
            }

            stack.push(result);

            continue;

        }


        // CUSTOM FUNCTIONS

        if (
            Object.prototype.hasOwnProperty.call(
                customFunctions,
                token
            )
        ) {

            if (stack.length < 1) {
                throw new Error("Invalid custom function input");
            }

            const value = stack.pop();

            const func = customFunctions[token];

            const result = evaluateExpression(
                func.expression,
                {
                    ...variables,
                    [func.parameter]: value
                },
                depth + 1
            );

            stack.push(result);

            continue;

        }


        throw new Error("Unknown identifier: " + token);

    }


    if (stack.length !== 1) {
        throw new Error("Invalid expression");
    }

    return stack[0];

}


/* =========================================================
   16. MAIN EXPRESSION EVALUATOR
   ========================================================= */

function evaluateExpression(expression, variables = {}, depth = 0) {

    if (
        typeof expression !== "string" ||
        !expression.trim()
    ) {

        throw new Error("Expression is empty");

    }

    if (depth > 20) {
        throw new Error("Maximum function recursion exceeded");
    }

    const tokens = tokenize(expression);

    const postfix = infixToPostfix(tokens);

    const result = evaluatePostfix(
        postfix,
        variables,
        depth
    );

    if (!Number.isFinite(result)) {
        throw new Error("Invalid result");
    }

    return result;

}


/* =========================================================
   17. FORMAT RESULT
   ========================================================= */

function formatResult(number) {

    if (Object.is(number, -0)) {
        return "0";
    }

    if (Number.isInteger(number)) {
        return String(number);
    }

    return String(
        Number(number.toFixed(10))
    );

}


/* =========================================================
   18. CALCULATE
   ========================================================= */

function calculate() {

    const expression = display.value.trim();

    if (!expression) {
        return;
    }

    try {

        const result = evaluateExpression(expression);

        const formattedResult = formatResult(result);

        resultDisplay.textContent = formattedResult;

        addHistory(
            expression,
            formattedResult
        );

    } catch (error) {

        resultDisplay.textContent = "Error";

        console.error(error.message);

    }

}


/* =========================================================
   19. CALCULATOR EVENTS
   ========================================================= */

if (equalBtn) {

    equalBtn.addEventListener("click", calculate);

}

if (display) {

    display.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();
            calculate();

        }

    });

}


/* =========================================================
   20. HISTORY
   ========================================================= */

function addHistory(expression, result) {

    const item = {

        expression: expression,
        result: result,
        time: new Date().toLocaleString()

    };

    history.unshift(item);

    // Keep latest 50 calculations

    history = history.slice(0, 50);

    saveStorage("calculatorHistory", history);

    renderHistory();

}


/* =========================================================
   21. RENDER HISTORY
   ========================================================= */

function renderHistory() {

    if (!historyList) return;

    historyList.innerHTML = "";

    if (history.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty-message";
        empty.textContent = "No calculations yet.";

        historyList.appendChild(empty);

        return;

    }


    history.forEach(item => {

        const div = document.createElement("div");

        div.className = "history-item";


        const expressionDiv = document.createElement("div");

        expressionDiv.className = "history-expression";
        expressionDiv.textContent = item.expression;


        const resultDiv = document.createElement("div");

        resultDiv.className = "history-result";
        resultDiv.textContent = "= " + item.result;


        const timeDiv = document.createElement("div");

        timeDiv.className = "history-time";
        timeDiv.textContent = item.time;


        div.appendChild(expressionDiv);
        div.appendChild(resultDiv);
        div.appendChild(timeDiv);


        // Click history to reuse expression

        div.addEventListener("click", () => {

            display.value = item.expression;
            display.focus();

        });


        historyList.appendChild(div);

    });

}


/* =========================================================
   22. CLEAR HISTORY
   ========================================================= */

if (clearHistoryBtn) {

    clearHistoryBtn.addEventListener("click", () => {

        history = [];

        localStorage.removeItem("calculatorHistory");

        renderHistory();

    });

}


/* =========================================================
   23. ESCAPE REGEX
   ========================================================= */

function escapeRegex(text) {

    return text.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

}


/* =========================================================
   24. CUSTOM FUNCTION EVENTS
   ========================================================= */

if (saveFunctionBtn) {

    saveFunctionBtn.addEventListener(
        "click",
        saveCustomFunction
    );

}


/* =========================================================
   25. SAVE CUSTOM FUNCTION
   ========================================================= */

function saveCustomFunction() {

    const name = functionNameInput.value.trim().toLowerCase();

    const parameter = functionParameterInput.value.trim().toLowerCase();

    const expression = functionExpressionInput.value.trim();


    if (!name || !parameter || !expression) {

        alert("Please fill all fields.");

        return;

    }


    // Validate function name

    if (!isIdentifier(name)) {

        alert("Invalid function name.");

        return;

    }


    // Validate parameter

    if (!isIdentifier(parameter)) {

        alert("Invalid parameter name.");

        return;

    }


    // Reserved names

    if (
        scientificFunctions[name] ||
        constants[name] !== undefined
    ) {

        alert("This name is reserved.");

        return;

    }


    if (name === parameter) {

        alert("Function name and parameter must be different.");

        return;

    }


    // Prevent overwriting existing built-in variables

    if (name === "x") {

        alert("This function name is reserved.");

        return;

    }


    const previousFunction = customFunctions[name];


    // Temporarily register function for validation

    customFunctions[name] = {

        parameter: parameter,
        expression: expression

    };


    try {

        // Validate the expression

        evaluateExpression(
            expression,
            { [parameter]: 1 }
        );

    } catch (error) {

        if (previousFunction) {
            customFunctions[name] = previousFunction;
        } else {
            delete customFunctions[name];
        }

        alert("Invalid function expression: " + error.message);

        return;

    }


    // Save permanently

    saveStorage("customFunctions", customFunctions);


    functionNameInput.value = "";
    functionParameterInput.value = "";
    functionExpressionInput.value = "";

    renderFunctions();

}


/* =========================================================
   26. RENDER CUSTOM FUNCTIONS
   ========================================================= */

function renderFunctions() {

    if (!functionList) return;

    functionList.innerHTML = "";

    const names = Object.keys(customFunctions);


    if (names.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty-message";
        empty.textContent = "No custom functions yet.";

        functionList.appendChild(empty);

        return;

    }


    names.forEach(name => {

        const func = customFunctions[name];

        const div = document.createElement("div");

        div.className = "function-item";


        const text = document.createElement("span");

        text.textContent =
            `${name}(${func.parameter}) = ${func.expression}`;


        const deleteBtn = document.createElement("button");

        deleteBtn.textContent = "Delete";


        deleteBtn.addEventListener("click", event => {

            event.stopPropagation();

            delete customFunctions[name];

            saveStorage("customFunctions", customFunctions);

            renderFunctions();

        });


        div.appendChild(text);
        div.appendChild(deleteBtn);


        // Insert function into calculator

        div.addEventListener("click", () => {

            display.value += `${name}(`;

            display.focus();

        });


        functionList.appendChild(div);

    });

}


/* =========================================================
   27. CANVAS RESIZE
   ========================================================= */

function resizeCanvas() {

    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

}


/* =========================================================
   28. DRAW GRAPH GRID
   ========================================================= */

function drawGrid(scale) {

    const rect = canvas.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);


    // GRID

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;


    // Vertical lines

    for (let x = 0; x <= width; x += scale) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);

        ctx.stroke();

    }


    // Horizontal lines

    for (let y = 0; y <= height; y += scale) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(width, y);

        ctx.stroke();

    }


    const centerX = width / 2;
    const centerY = height / 2;


    // AXES

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;


    // X Axis

    ctx.beginPath();

    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);

    ctx.stroke();


    // Y Axis

    ctx.beginPath();

    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);

    ctx.stroke();


    return {

        width,
        height,
        centerX,
        centerY

    };

}


/* =========================================================
   29. PLOT GRAPH
   ========================================================= */

function plotGraph() {

    if (!canvas || !ctx) return;

    let expression = graphExpression.value.trim();


    if (!expression) {

        alert("Enter an expression using x.");

        return;

    }


    // Support y = x^2

    expression = expression.replace(
        /^y\s*=\s*/i,
        ""
    );


    const scale = Math.max(
        5,
        Math.min(
            200,
            Number(graphScale.value) || 30
        )
    );


    try {

        // Validate the expression before plotting

        evaluateExpression(expression, { x: 1 });

    } catch (error) {

        alert("Invalid graph expression: " + error.message);

        return;

    }


    resizeCanvas();

    const graph = drawGrid(scale);


    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;

    ctx.beginPath();


    let previousValid = false;
    let previousY = 0;


    // Plot each pixel

    for (
        let pixelX = 0;
        pixelX <= graph.width;
        pixelX += 1
    ) {

        const mathX = (
            pixelX - graph.centerX
        ) / scale;


        try {

            const mathY = evaluateExpression(
                expression,
                { x: mathX }
            );


            const pixelY = graph.centerY - mathY * scale;


            // Skip invalid or extremely large values

            if (
                !Number.isFinite(pixelY) ||
                pixelY < -5000 ||
                pixelY > 5000
            ) {

                previousValid = false;

                continue;

            }


            // Avoid connecting across discontinuities

            if (
                previousValid &&
                Math.abs(pixelY - previousY) > graph.height * 0.75
            ) {

                previousValid = false;

            }


            if (!previousValid) {

                ctx.moveTo(pixelX, pixelY);

                previousValid = true;

            } else {

                ctx.lineTo(pixelX, pixelY);

            }

            previousY = pixelY;


        } catch (error) {

            previousValid = false;

        }

    }


    ctx.stroke();

}


/* =========================================================
   30. GRAPH BUTTON EVENT
   ========================================================= */

if (plotBtn) {

    plotBtn.addEventListener("click", plotGraph);

}


/* =========================================================
   31. GRAPH ENTER KEY
   ========================================================= */

if (graphExpression) {

    graphExpression.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            plotGraph();

        }

    });

}


/* =========================================================
   32. WINDOW RESIZE
   ========================================================= */

window.addEventListener("resize", () => {

    if (
        graphExpression &&
        graphExpression.value.trim()
    ) {

        plotGraph();

    }

});


/* =========================================================
   33. INITIAL APPLICATION LOAD
   ========================================================= */

renderHistory();

renderFunctions();

