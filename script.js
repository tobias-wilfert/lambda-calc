/* Peggy grammar for lambda calculus:
start = expr
expr = var / fun / app
var = letters:[a-z]+ { return { type: 'var', value: letters.join('') }; }
fun = "λ" variable:var "." body:body { return { type: 'fun', variable, body }; }
body = expr:expr { return expr; }
app = "(" left:expr _ right:expr ")" { return { type: 'app', left, right }; }
_ "whitespace"
  = [ \t\n\r]*
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

function substitute(variable, value, expr) {
    switch (expr.type) {
        case 'var':
            return expr.value === variable.value ? value : expr;
        case 'fun':
            if (expr.variable.value === variable.value || isVariableFreeIn(expr.variable, value)) {
                return expr;
            } else {
                return { type: 'fun', variable: expr.variable, body: substitute(variable, value, expr.body) };
            }
        case 'app':
            return { type: 'app', left: substitute(variable, value, expr.left), right: substitute(variable, value, expr.right) };
    }
}

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
                steps.push('&#955;' + expr.left.variable.value + '.' + astToString(expr.left.body) + '\t&rarr;\t' + astToString(substituted));
                return reduce(substituted, steps);
            } else {
                const reducedLeft = reduce(expr.left, steps);
                if (reducedLeft.expr.type === 'fun') {
                    const substituted = substitute(reducedLeft.expr.variable, expr.right, reducedLeft.expr.body);
                    steps.push('&#955;' + reducedLeft.expr.variable.value + '.' + astToString(reducedLeft.expr.body) + '\t&rarr;\t' + astToString(substituted));
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
            return '&#955;' + ast.variable.value + '.' + astToString(ast.body);
        case 'app':
            return '(' + astToString(ast.left) + ' ' + astToString(ast.right) + ')';
    }
}

function processLambda() {
    var input = document.getElementById('lambdaInput').value;
    try {
        var result = parser.parse(input);
        var reduction = reduce(result);
        document.getElementById('result').innerHTML = astToString(reduction.expr).replace(/ /g, '<span class="text-gray-300">_</span>');;
        document.getElementById('steps').innerHTML = reduction.steps.join('<br>').replace(/ /g, '<span class="text-gray-300">_</span>');;
    } catch (e) {
        document.getElementById('result').innerHTML = 'Error: ' + e.message;
    }
}