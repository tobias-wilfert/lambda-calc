/* Peggy grammar for lambda calculus:
start = expr
expr = var / fun / app
var = letters:[a-zA-z0-9']+ { return { type: 'var', value: letters.join('') }; }
fun = "λ" variable:var "." body:body { return { type: 'fun', variable, body }; }
body = expr:expr { return expr; }
app = "(" left:expr _ right:expr ")" { return { type: 'app', left, right }; }
_ "whitespace"
  = [ \t\n\r]*
*/

let variableCounter = 0;
function generateNewVariable() {
    return 'a' + variableCounter++;
}

/**
 * Checks if a variable is free in an expression.
 */
function isVariableFreeIn(variable, expr) {
    switch (expr.type) {
        case 'var':
            return expr.value === variable.value;
        case 'fun':
            return expr.variable.value !== variable.value && isVariableFreeIn(variable, expr.body);
        case 'app':
            return isVariableFreeIn(variable, expr.left) || isVariableFreeIn(variable, expr.right);
    }
}

/**
 * Substitutes occurrences of a variable with a given value in an expression.
 */
function substitute(variable, value, expr) {
    switch (expr.type) {
        case 'var':
            return expr.value === variable.value ? value : expr;
        case 'fun':
            if (expr.variable.value === variable.value) {
                return expr;
            } else if (isVariableFreeIn(expr.variable, value)) {
                let newVar = generateNewVariable();
                let newBody = substitute(expr.variable, { type: 'var', value: newVar }, expr.body);
                return { type: 'fun', variable: { type: 'var', value: newVar }, body: substitute(variable, value, newBody) };
            } else {
                return { type: 'fun', variable: expr.variable, body: substitute(variable, value, expr.body) };
            }
        case 'app':
            return { type: 'app', left: substitute(variable, value, expr.left), right: substitute(variable, value, expr.right) };
    }
}


/**
 * Reduces an expression in the lambda calculus.
 */
function reduce(expr, steps = []) {
    switch (expr.type) {
        case 'var':
            return { expr, steps };
        case 'fun':
            const reducedBody = reduce(expr.body, steps);
            return { expr: { type: 'fun', variable: expr.variable, body: reducedBody.expr }, steps: reducedBody.steps };
        case 'app':
            if (expr.left.type === 'fun') {
                const substituted = substitute(expr.left.variable, expr.right, expr.left.body);

                steps.push(lambda_expression.replace(astToString(expr.left), `<u>${astToString(expr.left)}</u>`));
                lambda_expression = lambda_expression.replace(astToString(expr), astToString(substituted));
                
                return reduce(substituted, steps);
            } else {
                const reducedLeft = reduce(expr.left, steps);
                if (reducedLeft.expr.type === 'fun') {
                    const substituted = substitute(reducedLeft.expr.variable, expr.right, reducedLeft.expr.body);
                    
                    temp_expr = {...expr};
                    temp_expr.left = reducedLeft.expr;
                    steps.push(lambda_expression.replace(astToString(reducedLeft.expr), `<u>${astToString(reducedLeft.expr)}</u>`));
                    lambda_expression = lambda_expression.replace(astToString(temp_expr), astToString(substituted));

                    return reduce(substituted, steps);
                } else {
                    const reducedRight = reduce(expr.right, steps);
                    return { expr: { type: 'app', left: reducedLeft.expr, right: reducedRight.expr }, steps: reducedRight.steps };
                }
            }
    }
}

function astToString(ast) {
    switch (ast.type) {
        case 'var':
            return ast.value;
        case 'fun':
            return '\u03BB' + ast.variable.value + '.' + astToString(ast.body);
        case 'app':
            return '(' + astToString(ast.left) + ' ' + astToString(ast.right) + ')';
    }
}

function processLambda() {  
    // TODO: Name these better such that they don't conflict with the global scope
    var input = document.getElementById('lambdaInput').value
    .replace(/_/g, ' ')
    .replace(/AND/gi, '\u03BBx10.\u03BBy10.((x10 y10) FALSE)')
    .replace(/NOT/gi, '\u03BBx9.((x9 FALSE) TRUE)')
    .replace(/TRUE/gi, '\u03BBx8.\u03BBy8.x8')
    .replace(/FALSE/gi, '\u03BBx7.\u03BBy7.y7')
    .replace(/COND/gi, '\u03BBa6.\u03BBb6.\u03BBc6.((c6 a6) b6)');

    try {
        var result = parser.parse(input);
        steps = [input];
        lambda_expression  = astToString(result);
        
        var reduction = reduce(result, steps);
        steps.push(astToString(reduction.expr));
        // TODO: Convert back the expressions to the constants

        document.getElementById('result').innerHTML = astToString(reduction.expr).replace(/ /g, '<span class="text-gray-300">_</span>');;
        document.getElementById('steps').innerHTML = reduction.steps.join('<br>&rarr;\t'); // .replace(/ /g, '<span class="text-gray-300">_</span>');;
    } catch (e) {
        document.getElementById('result').innerHTML = 'Error: ' + e.message;
    }
}