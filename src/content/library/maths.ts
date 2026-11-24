import type { SubjectLibrary } from "./types";

/**
 * GCSE Mathematics. Written from the DfE GCSE mathematics subject content, which every
 * board must teach (AQA 8300, Edexcel 1MA1, OCR J560 share it). Higher-tier-only content
 * is marked "h". Papers differ by board, so no paper is given.
 */
export const MATHS_LIBRARY: SubjectLibrary = {
  subject: "maths",
  defaults: { coverage: "shared", verification: "verified" },
  areas: [
    {
      area: "Number",
      groups: [
        {
          subtopic: "Structure and calculation",
          topics: [
            ["ordering-numbers", "Ordering numbers", "Order positive and negative integers, decimals and fractions using =, ≠, <, >, ≤ and ≥", "recall", { d: "f" }],
            ["four-operations", "The four operations", "Add, subtract, multiply and divide integers, decimals and negative numbers, written and mentally", "calc", { d: "f" }],
            ["order-of-operations", "Order of operations", "Use the order of operations, including brackets, powers and roots, to evaluate calculations", "calc", { d: "f" }],
            ["factors-multiples-primes", "Factors, multiples and primes", "Find factors, multiples and primes and write a number as a product of prime factors", "calc"],
            ["hcf-and-lcm", "HCF and LCM", "Find the highest common factor and lowest common multiple, including from prime factorisations and Venn diagrams", "problem"],
            ["powers-and-roots", "Powers and roots", "Use squares, cubes, square roots and cube roots, and the index laws for multiplying and dividing powers", "calc"],
            ["negative-and-fractional-indices", "Negative and fractional indices", "Evaluate and simplify expressions with zero, negative and fractional indices", "calc", { t: "h", d: "c" }],
            ["standard-form", "Standard form", "Write numbers in standard form and calculate with them, with and without a calculator", "calc"],
            ["surds", "Surds", "Simplify surds, calculate exactly with them and rationalise denominators", "algebra", { t: "h", d: "c" }],
            ["counting-strategies", "Systematic listing and the product rule", "List outcomes systematically and use the product rule for counting combinations", "problem"],
          ],
        },
        {
          subtopic: "Fractions, decimals and percentages",
          flags: { quiz: "maths/fractions-decimals-percentages" },
          topics: [
            ["fraction-arithmetic", "Calculating with fractions", "Add, subtract, multiply and divide fractions and mixed numbers", "calc", { d: "f" }],
            ["fdp-conversion", "Converting fractions, decimals and percentages", "Convert between fractions, decimals and percentages and compare their sizes", "calc", { d: "f" }],
            ["recurring-decimals", "Recurring decimals to fractions", "Convert a recurring decimal to a fraction using algebra", "algebra", { t: "h", d: "c" }],
            ["percentage-of-amounts", "Percentages of amounts", "Find a percentage of an amount and express one quantity as a percentage of another", "calc", { d: "f" }],
            ["percentage-change", "Percentage change and multipliers", "Increase and decrease by a percentage using multipliers and find percentage change", "calc"],
            ["reverse-percentages", "Reverse percentages", "Find the original value after a percentage increase or decrease", "problem"],
            ["simple-and-compound-interest", "Simple and compound interest", "Calculate simple interest, compound interest and depreciation over several periods", "problem"],
          ],
        },
        {
          subtopic: "Measures and accuracy",
          topics: [
            ["rounding", "Rounding and significant figures", "Round to a given number of decimal places or significant figures and estimate answers", "calc", { d: "f" }],
            ["estimation", "Estimating calculations", "Estimate answers by rounding to one significant figure and judge whether answers are sensible", "calc", { d: "f" }],
            ["error-intervals", "Error intervals", "Write error intervals for rounded and truncated values using inequality notation", "reason"],
            ["upper-and-lower-bounds", "Upper and lower bounds", "Use upper and lower bounds in calculations, including choosing the bound that gives the maximum or minimum", "problem", { t: "h", d: "c" }],
            ["units-and-conversions", "Units and conversions", "Convert between metric units, including area and volume units, and units of time", "calc"],
          ],
        },
      ],
    },
    {
      area: "Algebra",
      groups: [
        {
          subtopic: "Notation and manipulation",
          flags: { quiz: "maths/algebra-equations-expressions" },
          topics: [
            ["algebraic-notation", "Algebraic notation", "Use and interpret algebraic notation, including ab, 3y, a², a/b and brackets", "recall", { d: "f" }],
            ["simplifying-expressions", "Simplifying expressions", "Collect like terms and simplify expressions using the index laws", "algebra", { d: "f" }],
            ["substitution", "Substitution", "Substitute numbers into expressions and formulae, including negative numbers", "calc", { d: "f" }],
            ["expanding-brackets", "Expanding brackets", "Expand single, double and triple brackets", "algebra"],
            ["factorising", "Factorising", "Factorise into a single bracket, quadratics of the form x² + bx + c and the difference of two squares", "algebra"],
            ["factorising-harder-quadratics", "Factorising ax² + bx + c", "Factorise quadratics where the coefficient of x² is not 1", "algebra", { t: "h" }],
            ["rearranging-formulae", "Rearranging formulae", "Change the subject of a formula, including where the subject appears twice", "algebra"],
            ["algebraic-fractions", "Algebraic fractions", "Simplify, add, subtract, multiply and divide algebraic fractions", "algebra", { t: "h", d: "c" }],
            ["identities-and-proof", "Identities and algebraic proof", "Tell equations from identities and prove statements using algebra", "proof", { t: "h", d: "c" }],
            ["functions", "Functions, composite and inverse", "Interpret function notation and find composite and inverse functions", "algebra", { t: "h", d: "c" }],
          ],
        },
        {
          subtopic: "Equations and inequalities",
          flags: { quiz: "maths/algebra-equations-expressions" },
          topics: [
            ["linear-equations", "Solving linear equations", "Solve linear equations, including with unknowns on both sides and brackets", "algebra", { d: "f" }],
            ["forming-equations", "Forming and solving equations", "Form equations from a context or diagram and solve them to answer the question", "problem"],
            ["linear-inequalities", "Linear inequalities", "Solve linear inequalities and show the solution on a number line or as a set", "algebra"],
            ["simultaneous-linear", "Simultaneous linear equations", "Solve two linear simultaneous equations by elimination, substitution and graphically", "algebra"],
            ["solving-quadratics", "Solving quadratics by factorising", "Solve quadratic equations by factorising, and find roots graphically", "algebra"],
            ["quadratic-formula", "The quadratic formula", "Solve quadratic equations using the quadratic formula, giving answers to a required accuracy", "calc", { t: "h" }],
            ["completing-the-square", "Completing the square", "Complete the square to solve quadratics and find turning points", "algebra", { t: "h", d: "c" }],
            ["simultaneous-nonlinear", "Linear and quadratic simultaneous equations", "Solve a linear and a quadratic equation simultaneously, algebraically and graphically", "algebra", { t: "h", d: "c" }],
            ["quadratic-inequalities", "Quadratic inequalities", "Solve quadratic inequalities using a sketch, and represent regions on graphs", "algebra", { t: "h", d: "c" }],
            ["iteration", "Iteration", "Find approximate solutions to equations using an iterative formula", "calc", { t: "h", d: "c" }],
          ],
        },
        {
          subtopic: "Graphs",
          topics: [
            ["coordinates-and-midpoints", "Coordinates and midpoints", "Work with coordinates in all four quadrants and find the midpoint of a line segment", "graph", { d: "f" }],
            ["straight-line-graphs", "Straight-line graphs", "Plot straight lines and find gradients and intercepts using y = mx + c", "graph"],
            ["equation-of-a-line", "Finding the equation of a line", "Find the equation of a line through two points or through one point with a given gradient", "graph"],
            ["parallel-and-perpendicular", "Parallel and perpendicular lines", "Use gradients to identify and find parallel and perpendicular lines", "graph", { t: "h" }],
            ["quadratic-graphs", "Quadratic graphs", "Plot quadratic graphs and identify roots, intercepts and turning points", "graph"],
            ["other-graphs", "Cubic, reciprocal and exponential graphs", "Recognise, sketch and interpret cubic, reciprocal and exponential graphs", "graph"],
            ["trigonometric-graphs", "Trigonometric graphs", "Sketch and use the graphs of y = sin x, y = cos x and y = tan x", "graph", { t: "h" }],
            ["graph-transformations", "Transforming graphs", "Sketch translations and reflections of a given graph, such as y = f(x + a) and y = −f(x)", "graph", { t: "h", d: "c" }],
            ["real-life-graphs", "Real-life graphs", "Interpret distance–time, conversion and other real-life graphs, including rates of change", "data"],
            ["gradients-and-areas-under-graphs", "Gradients and areas under curves", "Estimate gradients of curves and areas under graphs and interpret them in context, such as acceleration", "graph", { t: "h", d: "c" }],
            ["equation-of-a-circle", "Equation of a circle", "Recognise the equation of a circle centred at the origin and find the tangent at a point", "graph", { t: "h", d: "c" }],
          ],
        },
        {
          subtopic: "Sequences",
          topics: [
            ["sequences-term-to-term", "Term-to-term rules", "Generate sequences from term-to-term rules and recognise special sequences such as square and triangular numbers", "recall", { d: "f" }],
            ["nth-term-linear", "nth term of linear sequences", "Find and use the nth term of an arithmetic sequence", "algebra"],
            ["geometric-and-fibonacci", "Geometric and Fibonacci-type sequences", "Recognise and continue geometric and Fibonacci-type sequences", "reason"],
            ["nth-term-quadratic", "nth term of quadratic sequences", "Find the nth term of a quadratic sequence", "algebra", { t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Ratio, proportion and rates of change",
      groups: [
        {
          subtopic: "Ratio",
          flags: { quiz: "maths/ratio-proportion" },
          topics: [
            ["ratio-notation", "Writing and simplifying ratios", "Write ratios in simplest form and in the form 1 : n", "calc", { d: "f" }],
            ["sharing-in-a-ratio", "Sharing in a ratio", "Divide a quantity in a given ratio and solve problems where a difference or part is known", "problem"],
            ["ratio-and-fractions", "Ratio and fractions", "Link ratios to fractions and to linear functions, and combine ratios", "reason"],
            ["best-buys", "Best buys and unit pricing", "Compare value for money using unit prices", "problem", { d: "f" }],
          ],
        },
        {
          subtopic: "Proportion and rates",
          flags: { quiz: "maths/ratio-proportion" },
          topics: [
            ["direct-proportion", "Direct proportion", "Solve direct proportion problems, including recipes and currency", "problem"],
            ["inverse-proportion", "Inverse proportion", "Solve inverse proportion problems and recognise their graphs", "problem"],
            ["proportion-equations", "Proportion equations", "Form and use equations such as y = kx² and y = k/x for direct and inverse proportion", "algebra", { t: "h" }],
            ["compound-measures", "Speed, density and pressure", "Use compound measures, including speed, density and pressure, and convert their units", "calc"],
            ["growth-and-decay", "Growth and decay", "Solve repeated percentage change problems with growth and decay", "problem"],
            ["scale-factors-and-maps", "Scale drawings and maps", "Use scale factors, scale drawings and map scales", "geometry", { d: "f" }],
          ],
        },
      ],
    },
    {
      area: "Geometry and measures",
      groups: [
        {
          subtopic: "Properties and constructions",
          flags: { quiz: "maths/angles-polygons" },
          topics: [
            ["angle-facts", "Angle facts", "Use angles on a line, around a point and vertically opposite to find missing angles", "geometry", { d: "f" }],
            ["parallel-line-angles", "Angles in parallel lines", "Use alternate and corresponding angles, giving reasons", "geometry"],
            ["polygon-angles", "Angles in polygons", "Find interior and exterior angles of regular and irregular polygons", "geometry"],
            ["properties-of-shapes", "Properties of 2D shapes", "Use the properties of triangles, quadrilaterals and other polygons", "recall", { d: "f" }],
            ["constructions", "Constructions", "Construct perpendicular bisectors, angle bisectors and perpendiculars using a ruler and compasses", "geometry"],
            ["loci", "Loci", "Draw loci and use them to find regions that satisfy several conditions", "geometry"],
            ["bearings", "Bearings", "Measure and use three-figure bearings, including in problems with angle facts", "geometry"],
            ["congruence", "Congruent triangles", "Use SSS, SAS, ASA and RHS to identify and prove congruent triangles", "proof"],
            ["circle-theorems", "Circle theorems", "Apply and prove the standard circle theorems, giving reasons", "proof", { t: "h", d: "c" }],
          ],
        },
        {
          subtopic: "Transformations and similarity",
          topics: [
            ["reflections-and-rotations", "Reflections and rotations", "Reflect and rotate shapes and describe these transformations fully", "geometry", { d: "f" }],
            ["translations-and-vectors", "Translations", "Translate shapes using column vectors and describe translations", "geometry", { d: "f" }],
            ["enlargements", "Enlargements", "Enlarge shapes with positive and fractional scale factors, and negative scale factors at higher tier", "geometry"],
            ["similar-shapes", "Similar shapes", "Find missing lengths in similar shapes using scale factors", "geometry"],
            ["similar-areas-and-volumes", "Similar areas and volumes", "Use the relationship between length, area and volume scale factors", "problem", { t: "h", d: "c" }],
          ],
        },
        {
          subtopic: "Mensuration",
          topics: [
            ["perimeter-and-area", "Perimeter and area", "Find perimeters and areas of rectangles, triangles, parallelograms, trapezia and compound shapes", "calc", { d: "f" }],
            ["circles-area-circumference", "Circles", "Calculate the circumference and area of circles and parts of circles", "calc"],
            ["arcs-and-sectors", "Arcs and sectors", "Calculate arc lengths and sector areas", "calc"],
            ["3d-shapes-and-nets", "3D shapes, nets and plans", "Identify properties of 3D shapes and draw nets, plans and elevations", "geometry", { d: "f" }],
            ["volume-of-prisms", "Volume of prisms and cylinders", "Find the volume of cuboids, prisms and cylinders", "calc"],
            ["surface-area", "Surface area", "Find the surface area of prisms, cylinders, cones and spheres", "calc"],
            ["cones-spheres-pyramids", "Cones, spheres and pyramids", "Find volumes of cones, spheres, pyramids and frustums, including composite solids", "problem", { t: "h" }],
          ],
        },
        {
          subtopic: "Pythagoras and trigonometry",
          flags: { quiz: "maths/pythagoras-trigonometry" },
          topics: [
            ["pythagoras", "Pythagoras' theorem", "Use Pythagoras' theorem to find missing sides in right-angled triangles", "calc"],
            ["right-angled-trigonometry", "Right-angled trigonometry", "Use sine, cosine and tangent to find sides and angles in right-angled triangles", "calc"],
            ["exact-trig-values", "Exact trigonometric values", "Know the exact values of sin, cos and tan for 0°, 30°, 45°, 60° and 90°", "recall"],
            ["sine-and-cosine-rules", "Sine and cosine rules", "Use the sine rule and cosine rule in any triangle", "calc", { t: "h" }],
            ["area-using-sine", "Area of a triangle using ½ab sin C", "Find the area of any triangle using ½ab sin C", "calc", { t: "h" }],
            ["3d-pythagoras-and-trig", "Pythagoras and trigonometry in 3D", "Use Pythagoras and trigonometry to find lengths and angles in 3D shapes", "problem", { t: "h", d: "c" }],
          ],
        },
        {
          subtopic: "Vectors",
          topics: [
            ["vector-arithmetic", "Vector arithmetic", "Add, subtract and multiply vectors by a scalar, and represent them on diagrams", "geometry"],
            ["vector-proof", "Vector geometry and proof", "Use vectors to prove that lines are parallel or that points are collinear", "proof", { t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Probability",
      groups: [
        {
          subtopic: "Probability",
          flags: { quiz: "maths/probability" },
          topics: [
            ["probability-scale", "The probability scale", "Use the 0–1 probability scale and the fact that probabilities of all outcomes sum to 1", "recall", { d: "f" }],
            ["relative-frequency", "Relative frequency", "Use relative frequency to estimate probability and expected outcomes", "calc"],
            ["sample-spaces", "Sample spaces", "List outcomes in sample space diagrams and tables and use them to find probabilities", "problem", { d: "f" }],
            ["venn-diagrams", "Venn diagrams and set notation", "Use Venn diagrams and set notation to find probabilities", "data"],
            ["tree-diagrams", "Tree diagrams", "Use tree diagrams for independent combined events", "problem"],
            ["conditional-probability", "Conditional probability", "Find conditional probabilities from trees, two-way tables and Venn diagrams, including without replacement", "problem", { t: "h", d: "c" }],
          ],
        },
      ],
    },
    {
      area: "Statistics",
      groups: [
        {
          subtopic: "Statistics",
          topics: [
            ["sampling", "Populations and sampling", "Describe populations and samples and the limitations of sampling", "reason", { d: "f" }],
            ["averages-and-range", "Averages and range", "Find the mean, median, mode and range and choose the most appropriate average", "calc", { d: "f" }],
            ["averages-from-tables", "Averages from frequency tables", "Find averages from frequency tables and estimate the mean from grouped data", "calc"],
            ["charts-and-diagrams", "Charts and diagrams", "Construct and interpret bar charts, pie charts, pictograms and frequency polygons", "data", { d: "f" }],
            ["scatter-graphs", "Scatter graphs and correlation", "Draw lines of best fit, describe correlation and know that correlation does not mean causation", "data"],
            ["time-series", "Time series", "Plot and interpret time series graphs and identify trends", "data"],
            ["cumulative-frequency-and-box-plots", "Cumulative frequency and box plots", "Draw cumulative frequency graphs and box plots and compare distributions using median and interquartile range", "data", { t: "h" }],
            ["histograms", "Histograms", "Draw and interpret histograms with unequal class widths using frequency density", "data", { t: "h", d: "c" }],
            ["comparing-distributions", "Comparing distributions", "Compare two data sets using an average and a measure of spread, in context", "evaluate"],
          ],
        },
      ],
    },
  ],
};
