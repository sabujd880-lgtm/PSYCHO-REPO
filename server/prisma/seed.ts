// server/prisma/seed.ts
// Comprehensive Database Seed Script for Phase 3 Psychology Knowledge Base & Digital Library
import { getDbClient } from '../src/services/prisma.ts';

export async function seedDatabase() {
  console.log('Seeding Phase 3 Psychology Platform Database...');
  const prisma = getDbClient();

  // 1. Initial Application Settings
  const existingSettings = await prisma.applicationSetting.findFirst();
  if (!existingSettings) {
    await prisma.applicationSetting.create({
      data: {
        preferredCitationStyle: 'APA 7th',
        preferredAiProvider: 'none',
        defaultExamConfig: {
          targetExam: 'UGC NET Psychology',
          defaultQuestionCount: 25,
          defaultTimeMinutes: 60
        },
        documentStorageConfig: {
          storageType: 'local',
          uploadDir: 'data/uploads',
          maxFileSizeMb: 50
        },
        applicationPreferences: {
          theme: 'light',
          autoSaveNotes: true,
          notificationsEnabled: false
        }
      }
    });
    console.log('Created default application settings.');
  }

  // 2. Resource Categories (All 10 required core psychology disciplines)
  const categoriesData = [
    { code: 'GEN', name: 'General Psychology', description: 'Core foundations: historical schools, cognitive processes, biological bases, and perception.' },
    { code: 'COG', name: 'Cognitive Psychology', description: 'Information processing, human memory systems, language, problem solving, and executive functions.' },
    { code: 'DEV', name: 'Developmental Psychology', description: 'Lifespan development, cognitive stages, emotional attachment, and moral maturation.' },
    { code: 'SOC', name: 'Social Psychology', description: 'Attitudes, social cognition, group dynamics, conformity, obedience, and prosocial behavior.' },
    { code: 'CLN', name: 'Clinical Psychology', description: 'Psychopathology, clinical formulation, therapeutic interventions, and diagnostic taxonomies.' },
    { code: 'CNS', name: 'Counselling Psychology', description: 'Therapeutic alliances, CBT, humanistic therapy, family dynamics, and crisis intervention.' },
    { code: 'NEU', name: 'Neuropsychology', description: 'Brain-behavior relationships, cognitive neuroscience, neurological deficits, and cortical localization.' },
    { code: 'PSY', name: 'Psychometrics', description: 'Classical test theory, item response theory, reliability estimation, and construct validity.' },
    { code: 'RES', name: 'Research Methods', description: 'Experimental design, hypothesis testing, sampling methods, and inferential statistics.' },
    { code: 'ASM', name: 'Psychological Assessment', description: 'Standardized psychological evaluation batteries, intelligence scales, and personality inventories.' }
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of categoriesData) {
    const existing = await prisma.resourceCategory.findUnique({ where: { code: cat.code } });
    if (!existing) {
      const created = await prisma.resourceCategory.create({ data: cat });
      categoryMap[cat.code] = created.id;
    } else {
      categoryMap[cat.code] = existing.id;
    }
  }
  console.log(`Verified ${categoriesData.length} core psychology categories.`);

  // 3. Complete 17-Section Academic Knowledge Articles
  const richArticles = [
    {
      title: 'Working Memory Architecture: Multi-Component Modal Systems',
      slug: 'working-memory-architecture',
      categoryId: categoryMap['COG'],
      definition: 'Working memory is a limited-capacity multicomponent cognitive system responsible for the temporary active maintenance, attentional manipulation, and dynamic integration of verbal and visuospatial information.',
      explanation: 'Introduced by Alan Baddeley and Graham Hitch in 1974, working memory replaces passive unitary short-term memory models with an active tripartite (and later quadripartite) executive control system.',
      introduction: 'In cognitive psychology and neuroscience, working memory underlies almost all higher-order mental activities, including fluid problem-solving, reading comprehension, mathematical reasoning, and situational awareness. It is fundamentally distinguished from passive short-term storage by its active executive manipulation.',
      historicalBackground: 'Early modal memory formulations (Atkinson & Shiffrin, 1968) posited a single, passive short-term buffer. In 1974, Baddeley and Hitch demonstrated via dual-task interference paradigms that auditory-verbal and visual processing could occur concurrently with negligible mutual impairment, necessitating a multicomponent architecture. In 2000, Baddeley added the Episodic Buffer to explain cross-modal binding.',
      keyTheorists: ['Alan Baddeley', 'Graham Hitch', 'Nelson Cowan', 'Randall Engle'],
      majorTheories: '1. Baddeley & Hitch Multi-Component Model (Phonological Loop, Visuospatial Sketchpad, Central Executive, Episodic Buffer)\n2. Cowan Embedded-Process Model (Working memory as activated long-term memory under attentional focus)\n3. Engle Executive Attention Theory (Working memory capacity reflects domain-general attentional control in the presence of distraction).',
      coreConcepts: 'Central Executive, Phonological Store, Articulatory Rehearsal, Visuospatial Sketchpad, Episodic Buffer, Cognitive Load, Span Capacity, Attentional Gating.',
      principles: '1. Modular Independence: Verbal and visuospatial subsystems operate through distinct neural pathways without direct capacity interference.\n2. Attentional Resource Limitation: The Central Executive possesses strictly finite processing capacity.\n3. Decay & Rehearsal: Unrehearsed verbal traces decay within 1.5 to 2.0 seconds.',
      classification: 'Cognitive Science • Memory Systems • Executive Functions',
      models: 'Baddeley & Hitch (2000) Quadripartite Structural Model; Cowan (2001) Concentric Attentional Model.',
      applications: 'Instructional design via Cognitive Load Theory, remediation strategies for ADHD and specific learning disorders, human factors engineering in high-stakes avionics.',
      clinicalRelevance: 'Significant working memory degradation is diagnostic in Attention-Deficit/Hyperactivity Disorder (ADHD), early Alzheimer\'s disease, schizophrenia, and prefrontal traumatic brain injury (TBI).',
      researchEvidence: 'Extensively corroborated via fMRI and PET imaging demonstrating dorsolateral prefrontal cortex (DLPFC) activation during N-back and Sternberg tasks, alongside left inferior parietal activation for the phonological loop.',
      examples: 'Standardized Dual N-Back task, Reading Span Test (Daneman & Carpenter, 1980), WAIS-IV Digit Span and Letter-Number Sequencing subtests.',
      limitations: 'Laboratory dual-task paradigms often fail to replicate dynamic, context-rich real-world environments with emotional and physiological stressors.',
      referencesCitations: 'Baddeley, A. (2000). The episodic buffer: A new component of working memory? Trends in Cognitive Sciences, 4(11), 417-423. https://doi.org/10.1016/S1364-6613(00)01538-2\nBaddeley, A. D., & Hitch, G. (1974). Working memory. Psychology of Learning and Motivation, 8, 47-89.',
      recommendedReading: 'Baddeley, A. (2007). Working Memory, Thought, and Action. Oxford University Press.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['Central Executive', 'Phonological Loop', 'Visuospatial Sketchpad', 'Episodic Buffer', 'Cognitive Load'],
      theories: 'Baddeley & Hitch (1974, 2000) Multi-Component Model; Cowan (2001) Embedded-Process Model.',
      authorReferences: 'Baddeley, A. (2000). Trends in Cognitive Sciences, 4(11), 417-423.',
      sourceReferences: 'Trends in Cognitive Sciences, 4(11), 417-423.',
      doi: '10.1016/S1364-6613(00)01538-2',
      publicationInfo: 'Trends in Cognitive Sciences, 4(11), 417-423'
    },
    {
      title: 'Cognitive Behavioral Model: Schemas, Automatic Thoughts, and Cognitive Distortions',
      slug: 'cognitive-behavioral-model',
      categoryId: categoryMap['CLN'],
      definition: 'The Cognitive Behavioral Model posits that psychological distress and maladaptive behaviors are primarily mediated by cognitive appraisals—specifically organized core schemas, intermediate beliefs, and automatic thoughts—rather than external events themselves.',
      explanation: 'Formulated by Aaron T. Beck in the 1960s, the model explains that emotional disorders arise from systematic information-processing biases (cognitive distortions) that reinforce dysfunctional core beliefs regarding oneself, the world, and the future (the Cognitive Triad).',
      introduction: 'Cognitive Behavioral Therapy (CBT) represents the gold standard empirically supported therapeutic framework in modern clinical psychology. The core premise is encapsulated in Epictetus\' stoic dictum: men are disturbed not by things, but by the view which they take of them.',
      historicalBackground: 'Aaron Beck developed cognitive therapy while investigating psychoanalytic formulations of depression, observing consistent negative cognitive shifts and self-blaming interpretations. Concurrently, Albert Ellis formulated Rational Emotive Behavior Therapy (REBT). In the 1970s and 1980s, the behavioral and cognitive paradigms integrated into modern CBT.',
      keyTheorists: ['Aaron T. Beck', 'Judith S. Beck', 'Albert Ellis', 'David M. Clark'],
      majorTheories: '1. Beck\'s Cognitive Triad of Depression (Negative view of Self, World/Experience, and Future)\n2. Ellis\'s ABCDE Model (Activating event, Beliefs, Emotional Consequences, Disputation, Effective outlook)\n3. Clark & Wells Cognitive Model of Social Anxiety.',
      coreConcepts: 'Core Beliefs, Intermediate Beliefs, Negative Automatic Thoughts (NATs), Cognitive Distortions (Catastrophizing, All-or-Nothing, Mind Reading), Decatastrophizing, Socratic Questioning, Behavioral Experiments.',
      principles: '1. Cognitive Mediation: Cognition influences emotional state and physiological arousal.\n2. Empirical Collaboration: Therapist and client act as co-scientists testing hypotheses.\n3. Problem-Focused & Present-Oriented: Emphasis on current maintaining factors.',
      classification: 'Clinical Psychology • Psychotherapy Systems • Cognitive Psychopathology',
      models: 'Beckian Cross-Sectional Formulation (Situation -> Automatic Thoughts -> Emotion / Physical / Behavior); Longitudinal Schema Model.',
      applications: 'First-line evidence-based protocol for Major Depressive Disorder, Generalized Anxiety Disorder, Panic Disorder, OCD, PTSD, and Bulimia Nervosa.',
      clinicalRelevance: 'Directly guides case formulation, Thought Records, Exposure with Response Prevention (ERP), and Cognitive Restructuring protocols.',
      researchEvidence: 'Supported by hundreds of randomized controlled trials (RCTs) demonstrating efficacy comparable or superior to pharmacotherapy, with lower post-treatment relapse rates.',
      examples: 'Thought Record diary challenging arbitrary inference: "My supervisor didn\'t say good morning, therefore I am getting fired" re-evaluated to "She was on an urgent phone call."',
      limitations: 'May underemphasize systemic socioeconomic trauma, attachment injuries, and unconscious defense mechanisms; requires sufficient metacognitive capability.',
      referencesCitations: 'Beck, A. T. (1979). Cognitive Therapy of Depression. Guilford Press.\nBeck, J. S. (2020). Cognitive Behavior Therapy: Basics and Beyond (3rd ed.). Guilford Press.',
      recommendedReading: 'Beck, A. T., & Alford, B. A. (2009). Depression: Causes and Treatment (2nd ed.). University of Pennsylvania Press.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['Core Beliefs', 'Automatic Thoughts', 'Cognitive Triad', 'Cognitive Distortions', 'Behavioral Experiments'],
      theories: 'Beck\'s Cognitive Therapy; Ellis Rational Emotive Behavior Therapy.',
      authorReferences: 'Beck, A. T. (1979). Cognitive Therapy of Depression. Guilford Press.',
      sourceReferences: 'Guilford Press Clinical Psychology Series.',
      doi: '10.1001/archpsyc.1979.01780090045005',
      publicationInfo: 'Guilford Press, New York'
    },
    {
      title: 'Signal Detection Theory: Sensitivity, Response Bias, and Psychophysical Decision Making',
      slug: 'signal-detection-theory',
      categoryId: categoryMap['RES'],
      definition: 'Signal Detection Theory (SDT) is a mathematical framework that quantifies an observer\'s ability to differentiate between information-bearing energy patterns (signals) and random background fluctuations (noise), mathematically disentangling perceptual sensitivity from decision criteria.',
      explanation: 'Unlike classical Fechnerian threshold methods which conflate sensory ability with subject motivation, SDT models decision-making as a probabilistic assessment yielding four discrete outcomes: Hits, Misses, False Alarms, and Correct Rejections.',
      introduction: 'Originating in radar and communications engineering during the 1950s (Tanner & Swets), Signal Detection Theory revolutionized psychophysics, experimental psychology, diagnostic medicine, and cognitive evaluation by demonstrating that perceptual performance is fundamentally a two-stage process: sensation followed by decision.',
      historicalBackground: 'Gustav Fechner\'s 19th-century psychophysics assumed a fixed absolute sensory threshold. Green and Swets (1966) showed that whether a participant reports detecting a faint stimulus depends on both sensory acuity and decision payoff/expectation matrices.',
      keyTheorists: ['David M. Green', 'John A. Swets', 'Wilson P. Tanner Jr.', 'Donald Laming'],
      majorTheories: '1. Equal-Variance Gaussian Signal Detection Model\n2. Receiver Operating Characteristic (ROC) Curve Analysis\n3. High-Threshold and Choice-Choice Theoretical Models.',
      coreConcepts: 'Sensitivity (d-prime / d\'), Response Criterion (c), Likelihood Ratio (beta / β), Hit Rate, False Alarm Rate, Noise Distribution, Signal-Plus-Noise Distribution, ROC Curve, Area Under the Curve (AUC).',
      principles: '1. Inherent Noise: Neural and environmental noise is present in every detection episode.\n2. Orthogonal Independence: Sensitivity (d\') and Response Bias (c) are mathematically orthogonal and can vary independently.\n3. Criterion Shift: Modifying payoff matrices shifts criterion without altering sensory sensitivity.',
      classification: 'Psychophysics • Mathematical Psychology • Quantitative Research Methods',
      models: 'Normal-Normal Signal Detection Model; Parametric and Non-Parametric ROC Space Models.',
      applications: 'Radiological tumor screening, eyewitness lineup evaluation, air traffic control vigilance monitoring, memory recognition test scoring (Old/New paradigms).',
      clinicalRelevance: 'Crucial for evaluating diagnostic test accuracy in psychiatric screening tools (sensitivity vs. specificity trade-offs, positive and negative predictive values).',
      researchEvidence: 'Decades of empirical psychophysics demonstrate invariant d\' across liberal vs. conservative criterion instructions within identical human observers.',
      examples: 'Memory recognition test: Participant correctly identifies studied words (Hit) vs. erroneously identifies unstudied lure words (False Alarm). Calculation of d\' = Z(Hit) - Z(FA).',
      limitations: 'Assumes continuous normal distributions with equal variance; unequal-variance or categorical data requires non-parametric corrections (e.g., A\', B\'\'D).',
      referencesCitations: 'Green, D. M., & Swets, J. A. (1966). Signal Detection Theory and Psychophysics. John Wiley & Sons.\nSwets, J. A. (1996). Signal Detection Theory and ROC Analysis in Psychology and Diagnostics. Lawrence Erlbaum.',
      recommendedReading: 'Macmillan, N. A., & Creelman, C. D. (2005). Detection Theory: A User\'s Guide (2nd ed.). Lawrence Erlbaum Associates.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['d-prime', 'Response Bias', 'Receiver Operating Characteristic', 'Hits and False Alarms', 'Payoff Matrix'],
      theories: 'Green & Swets (1966) Signal Detection Theory; ROC Analysis.',
      authorReferences: 'Green, D. M., & Swets, J. A. (1966). John Wiley & Sons.',
      sourceReferences: 'John Wiley & Sons Classic Psychological Monograph.',
      doi: '10.1037/h0020147',
      publicationInfo: 'John Wiley & Sons, New York'
    },
    {
      title: 'Classical Test Theory, True Score Variance, and Reliability Estimation',
      slug: 'classical-test-theory-reliability',
      categoryId: categoryMap['PSY'],
      definition: 'Classical Test Theory (CTT), or True Score Theory, posits that any observed psychological test score (X) is a linear composite of an unobservable true construct score (T) and random measurement error (E): X = T + E.',
      explanation: 'CTT provides the mathematical foundation for estimating test reliability (the proportion of observed score variance attributable to true score variance: r_xx = Var(T) / Var(X)) and calculating the Standard Error of Measurement (SEM).',
      introduction: 'In psychometrics, measurement precision is fundamental to test validity. CTT assumes that true scores and random errors are uncorrelated, and that the expected value of random errors over infinite administrations is zero.',
      historicalBackground: 'Charles Spearman (1904) laid the mathematical foundation of CTT while developing methods to correct correlation coefficients for attenuation. Gulliksen (1950) synthesized CTT into a unified formal axiomatic system.',
      keyTheorists: ['Charles Spearman', 'Harold Gulliksen', 'Lee J. Cronbach', 'Lord & Novick'],
      majorTheories: '1. Spearman Classical True Score Model\n2. Domain Sampling Theory\n3. Cronbach Alpha & McDonald Omega Internal Consistency Formulations.',
      coreConcepts: 'Observed Score, True Score, Random Error, Systematic Error, Test-Retest Reliability, Alternate-Forms Reliability, Internal Consistency, Split-Half (Spearman-Brown Formula), Cronbach\'s Alpha (α), McDonald\'s Omega (ω), Standard Error of Measurement (SEM).',
      principles: '1. Zero Expected Error: E(e) = 0 across repeated hypothetical testings.\n2. Independence: Correlation between True Score and Error is zero (r_TE = 0).\n3. Error Orthogonality: Errors on distinct tests are uncorrelated (r_E1E2 = 0).',
      classification: 'Psychometrics • Measurement Theory • Quantitative Evaluation',
      models: 'Spearman-Gulliksen Linear Additive Model: X = T + E; Spearman-Brown Prophecy Formula for test lengthening.',
      applications: 'Standardization and norming of intelligence scales (WAIS, WISC), clinical personality inventories (MMPI, BDI), and high-stakes licensing examinations.',
      clinicalRelevance: 'Determines whether a change in a patient\'s assessment score reflects genuine clinical improvement or merely random test-retest measurement noise (Reliable Change Index).',
      researchEvidence: 'Universally utilized across psychometric literature for over a century; modern validation frameworks require reporting both Cronbach\'s α and McDonald\'s ω.',
      examples: 'A client scores 105 on an IQ test with SEM = 3; the 95% confidence interval for their true score is 105 ± 1.96(3) = [99.1, 110.9].',
      limitations: 'Assumes equal measurement precision across all ability levels (unlike Item Response Theory); item statistics (item difficulty, discrimination) are strictly sample-dependent.',
      referencesCitations: 'Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. Psychometrika, 16(3), 297-334. https://doi.org/10.1007/BF02310555\nLord, F. M., & Novick, M. R. (1968). Statistical Theories of Mental Test Scores. Addison-Wesley.',
      recommendedReading: 'Nunnally, J. C., & Bernstein, I. H. (1994). Psychometric Theory (3rd ed.). McGraw-Hill.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['Observed Score', 'True Score', 'Random Error', 'Standard Error of Measurement', 'Internal Consistency'],
      theories: 'Spearman (1904) Classical Test Theory; Cronbach & Meehl (1955) Construct Validity Framework.',
      authorReferences: 'Cronbach, L. J. (1951). Psychometrika, 16(3), 297-334.',
      sourceReferences: 'Psychometrika Psychometric Monograph.',
      doi: '10.1007/BF02310555',
      publicationInfo: 'Psychometrika, 16(3), 297-334'
    },
    {
      title: 'Biopsychosocial Model: Systemic Etiology and Health Psychology',
      slug: 'biopsychosocial-model',
      categoryId: categoryMap['GEN'],
      definition: 'The Biopsychosocial Model is an integrative conceptual framework positing that biological, psychological, and social factors dynamically interact to influence human health, illness manifestation, and psychological functioning.',
      explanation: 'Proposed by George L. Engel in 1977, the model explicitly critiques biomedical reductionism, asserting that biological variables alone are insufficient to understand disease onset, symptom severity, patient experience, or therapeutic outcomes.',
      introduction: 'The Biopsychosocial Model bridges somatic medicine, psychiatric nosology, clinical psychology, and medical sociology. It views the individual as a nested open system where molecular and cellular events interact reciprocally with thoughts, emotions, family systems, and sociocultural determinants.',
      historicalBackground: 'Throughout the 20th century, the Cartesian biomedical paradigm treated somatic disease as solely biochemical or infectious pathophysiology. In 1977, internist and psychiatrist George Engel published "The Need for a New Medical Model: A Challenge for Biomedicine" in Science, advocating a holistic systems approach.',
      keyTheorists: ['George L. Engel', 'Ludwig von Bertalanffy', 'Howard Brody', 'Robert Ader'],
      majorTheories: '1. General Systems Theory (Bertalanffy)\n2. Diathesis-Stress Model\n3. Psychoneuroimmunology (Ader & Cohen)\n4. Social Determinants of Health Framework (WHO).',
      coreConcepts: 'Systems Hierarchy, Reciprocal Determinism, Psychoneuroimmunology (HPA Axis), Illness vs. Disease, Allostatic Load, Resilience, Social Support Buffering.',
      principles: '1. Non-Reductionism: Biological data cannot be interpreted in isolation from psychological context.\n2. Reciprocal Causality: Psychological distress alters endocrine and immune function; physiological pathology alters mood and cognition.\n3. Patient-Centered Care: The subjective patient experience is clinically essential.',
      classification: 'Health Psychology • Behavioral Medicine • Theoretical Foundations',
      models: 'Engel Nested Systems Hierarchy (Subatomic -> Cellular -> Organ -> Person -> Two-Person -> Family -> Community -> Culture).',
      applications: 'Comprehensive chronic pain management, lifestyle medicine, functional neurological disorder diagnosis, integrated primary care behavioral health.',
      clinicalRelevance: 'Fundamental to psychiatric assessment: clinical formulation requires articulating biological predispositions (genetics), psychological precipitants/perpetuators (coping mechanisms), and social stressors/supports.',
      researchEvidence: 'Vigorously substantiated by psychoneuroimmunology demonstrating that chronic psychosocial stress triggers systemic inflammation via excessive cortisol and pro-inflammatory cytokine release (IL-6, TNF-alpha).',
      examples: 'Etiology of coronary heart disease involves arterial stenosis (Bio), hostility and Type A behavioral reactivity (Psycho), and socioeconomic occupational chronic strain (Social).',
      limitations: 'Often criticized for lacking precise mathematical weighting of variables, occasionally leading to vague clinical application ("bio-bio-bio" in practice).',
      referencesCitations: 'Engel, G. L. (1977). The need for a new medical model: A challenge for biomedicine. Science, 196(4286), 129-136. https://doi.org/10.1126/science.847460\nBorrell-Carrió, F., Suchman, A. L., & Epstein, R. M. (2004). The biopsychosocial model 25 years later: Principles, practice, and scientific inquiry. Annals of Family Medicine, 2(6), 576-582.',
      recommendedReading: 'Sarafino, E. P., & Smith, T. W. (2014). Health Psychology: Biopsychosocial Interactions (8th ed.). John Wiley & Sons.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['Biological Factors', 'Psychological Factors', 'Social Determinants', 'Allostatic Load', 'General Systems Theory'],
      theories: 'Engel (1977) Biopsychosocial Model; General Systems Theory.',
      authorReferences: 'Engel, G. L. (1977). Science, 196(4286), 129-136.',
      sourceReferences: 'Science, 196(4286), 129-136.',
      doi: '10.1126/science.847460',
      publicationInfo: 'Science, 196(4286), 129-136'
    },
    {
      title: 'The Five-Factor Model of Personality: Trait Taxonomy and Psychometric Structure',
      slug: 'five-factor-personality-model',
      categoryId: categoryMap['ASM'],
      definition: 'The Five-Factor Model (FFM) is a dimensional taxonomy of human personality structure organizing behavioral, emotional, and cognitive tendencies into five broad orthogonal domains: Neuroticism, Extraversion, Openness to Experience, Agreeableness, and Conscientiousness (OCEAN).',
      explanation: 'Derived through lexical analysis (Allport, Cattell, Norman) and factor-analytic validation (Costa & McCrae, Goldberg), the Big Five represents the most replicated and cross-culturally validated personality framework in psychology.',
      introduction: 'Personality psychology sought for decades to resolve the true number of foundational trait dimensions. The FFM demonstrated that whether evaluated via self-reports, peer ratings, or cross-cultural linguistic dictionaries, personality variance reliably condenses into five core factors.',
      historicalBackground: 'Francis Galton formulated the lexical hypothesis: important individual differences become encoded into natural language. Raymond Cattell identified 16 factors, but Tupes & Christal (1961) and Warren Norman (1963) demonstrated that Cattell\'s data reduced to 5 recurring factors. Paul Costa and Robert McCrae solidified the FFM with the NEO Personality Inventory.',
      keyTheorists: ['Paul T. Costa Jr.', 'Robert R. McCrae', 'Lewis R. Goldberg', 'Warren T. Norman'],
      majorTheories: '1. Five-Factor Theory (Costa & McCrae: Basic Tendencies vs. Characteristic Adaptations)\n2. Lexical Big Five Approach (Goldberg)\n3. Cybernetic Big Five Theory (DeYoung).',
      coreConcepts: 'Neuroticism (Emotional Stability), Extraversion, Openness to Experience (Intellect), Agreeableness, Conscientiousness, Facet Scales, Lexical Hypothesis, Rank-Order Stability, Heritability.',
      principles: '1. Orthogonality: The five traits are largely statistically independent across populations.\n2. Biological Substrate: Twin studies demonstrate 40-50% broad heritability for each domain.\n3. Universal Generalizability: Replicated across diverse linguistic and cultural traditions.',
      classification: 'Personality Psychology • Trait Theory • Psychological Assessment',
      models: 'NEO PI-R Hierarchical Trait Architecture (5 Domains x 6 Facets = 30 Facet Scales); FFT Systems Model.',
      applications: 'Personnel selection in industrial/organizational psychology, academic achievement prediction, clinical psychopathology risk profiling, health behavior adherence.',
      clinicalRelevance: 'DSM-5 Section III Alternative Model for Personality Disorders (AMPD) directly maps personality pathology onto extreme poles of FFM dimensions (e.g., Borderline = high Neuroticism, low Conscientiousness/Agreeableness).',
      researchEvidence: 'Longitudinal studies (e.g., Baltimore Longitudinal Study of Aging) demonstrate high 30-year rank-order stability (test-retest r = 0.60 to 0.80) in adulthood.',
      examples: 'Conscientiousness consistently emerges as the strongest non-cognitive predictor of academic GPA, job performance, and longevity.',
      limitations: 'May omit potential 6th dimensions such as Honesty-Humility (HEXACO model by Ashton & Lee); descriptive rather than mechanistic.',
      referencesCitations: 'Costa, P. T., & McCrae, R. R. (1992). Revised NEO Personality Inventory (NEO PI-R) and NEO Five-Factor Inventory (NEO-FFI) Professional Manual. Psychological Assessment Resources.\nMcCrae, R. R., & John, O. P. (1992). An introduction to the five-factor model and its applications. Journal of Personality, 60(2), 175-215.',
      recommendedReading: 'John, O. P., Robins, R. W., & Pervin, L. A. (Eds.). (2008). Handbook of Personality: Theory and Research (3rd ed.). Guilford Press.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism', 'Facet Scales'],
      theories: 'Costa & McCrae Five-Factor Theory; Goldberg Lexical Framework.',
      authorReferences: 'Costa, P. T., & McCrae, R. R. (1992). Psychological Assessment Resources.',
      sourceReferences: 'Journal of Personality, 60(2), 175-215.',
      doi: '10.1111/j.1467-6494.1992.tb00970.x',
      publicationInfo: 'Journal of Personality, 60(2), 175-215'
    },
    {
      title: 'Attachment Theory: Internal Working Models and Ethological Development',
      slug: 'attachment-theory',
      categoryId: categoryMap['DEV'],
      definition: 'Attachment Theory is an evolutionary-ethological and psychodynamic developmental framework positing that human infants possess an innate biological drive to seek proximity to primary caregivers, establishing internalized cognitive representations (Internal Working Models) that guide lifelong relationship expectations.',
      explanation: 'Formulated by John Bowlby and operationalized by Mary Ainsworth, attachment dynamics explain how responsive vs. inconsistent maternal care shapes infant emotional regulation and organizes secure vs. insecure attachment patterns.',
      introduction: 'Bowlby synthesized psychoanalytic concepts with Konrad Lorenz\'s ethology and Harlow\'s rhesus monkey experiments, arguing that infant distress upon separation is an evolved adaptive survival mechanism, not secondary drive gratification derived from feeding.',
      historicalBackground: 'John Bowlby\'s post-WWII observations of hospitalized and institutionalized children (1951 WHO report) documented devastating emotional withdrawal. In the 1970s, Mary Ainsworth designed the Strange Situation laboratory protocol to classify infant attachment styles.',
      keyTheorists: ['John Bowlby', 'Mary D. Salter Ainsworth', 'Mary Main', 'Peter Fonagy'],
      majorTheories: '1. Bowlby\'s Ethological Attachment Theory\n2. Ainsworth\'s Three-Style Classification (Secure, Insecure-Avoidant, Insecure-Resistant/Ambivalent)\n3. Main & Solomon Disorganized/Disoriented Attachment (Type D)\n4. Mentalization & Epistemic Trust (Fonagy).',
      coreConcepts: 'Attachment Behavioral System, Secure Base, Safe Haven, Internal Working Models, Strange Situation, Maternal Sensitivity, Separation Anxiety, Adult Attachment Interview (AAI).',
      principles: '1. Evolutionary Drive: Attachment behaviors are biologically hardwired for predator protection.\n2. Secure Base Phenomenon: Exploration of the environment requires confident access to a secure caregiver.\n3. Intergenerational Transmission: Parent attachment security on the AAI strongly predicts infant attachment.',
      classification: 'Developmental Psychology • Ethology • Social & Emotional Development',
      models: 'Ainsworth Strange Situation Paradigm (8 Episodes of Separation and Reunion); Bartholomew & Horowitz 4-Category Adult Attachment Grid.',
      applications: 'Early childhood intervention programs, foster care and adoption assessment, pediatric healthcare protocols, emotionally focused couples therapy (EFT).',
      clinicalRelevance: 'Disorganized attachment is a major developmental risk factor for Borderline Personality Disorder, complex PTSD, dissociative symptoms, and chronic affect dysregulation.',
      researchEvidence: 'Minnesota Longitudinal Study of Risk and Adaptation followed children from infancy to age 30+, demonstrating that infant attachment predicts adult romantic relationship competence, emotional resilience, and psychopathology.',
      examples: 'In the Strange Situation, a securely attached infant explores when mother is present, shows distress during absence, and actively seeks comfort and settles quickly upon reunion.',
      limitations: 'Cross-cultural variations (e.g., higher rates of resistant attachment in Japan or avoidant in Germany) reflect cultural socialization variations rather than intrinsic pathology.',
      referencesCitations: 'Bowlby, J. (1969). Attachment and Loss: Vol. 1. Attachment. Basic Books.\nAinsworth, M. D. S., Blehar, M. C., Waters, E., & Wall, S. (1978). Patterns of Attachment: A Psychological Study of the Strange Situation. Lawrence Erlbaum.',
      recommendedReading: 'Cassidy, J., & Shaver, P. R. (Eds.). (2016). Handbook of Attachment: Theory, Research, and Clinical Applications (3rd ed.). Guilford Press.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['Secure Base', 'Safe Haven', 'Internal Working Models', 'Strange Situation', 'Disorganized Attachment'],
      theories: 'Bowlby Evolutionary Attachment Theory; Ainsworth Strange Situation Framework.',
      authorReferences: 'Bowlby, J. (1969). Attachment and Loss. Basic Books.',
      sourceReferences: 'Basic Books Developmental Series.',
      doi: '10.1080/14616730210154225',
      publicationInfo: 'Basic Books, New York'
    },
    {
      title: 'Neuroplasticity, Synaptic Transmission, and Long-Term Potentiation',
      slug: 'neuroplasticity-ltp',
      categoryId: categoryMap['NEU'],
      definition: 'Neuroplasticity is the capacity of the nervous system to modify its structural organization and functional properties in response to experience, learning, environmental change, or neurological injury. Long-Term Potentiation (LTP) is the persistent, activity-dependent strengthening of synaptic efficacy representing the cellular mechanism of learning and memory.',
      explanation: 'First observed by Terje Lømo in 1966 and published with Timothy Bliss in 1973, LTP in the hippocampal perforant path satisfies Donald Hebb\'s 1949 postulate: when neuron A repeatedly fires neuron B, metabolic and structural changes strengthen synaptic transmission.',
      introduction: 'For much of the 20th century, the mature adult brain was believed to be fixed and immutable. Groundbreaking discoveries in synaptic physiology, adult neurogenesis (Eriksson et al., 1998), and cortical map reorganization (Merzenich) proved that neuroplasticity persists across the entire human lifespan.',
      historicalBackground: 'Santiago Ramón y Cajal hypothesized that learning involves strengthening neural junctions. Donald Hebb (1949) formulated the rule "neurons that fire together, wire together." Bliss & Lømo (1973) experimentally confirmed this in the rabbit hippocampus.',
      keyTheorists: ['Donald O. Hebb', 'Timothy Bliss', 'Terje Lømo', 'Eric R. Kandel', 'Michael Merzenich'],
      majorTheories: '1. Hebbian Synapse Theory\n2. NMDA-Receptor Mediated Calcium Influx Model of LTP\n3. Synaptic Tagging and Capture Hypothesis (Frey & Morris)\n4. Long-Term Depression (LTD) & Synaptic Homeostasis.',
      coreConcepts: 'Neuroplasticity, Long-Term Potentiation (LTP), Long-Term Depression (LTD), NMDA Receptors, AMPA Receptors, Glutamate, Calcium Influx, Synaptogenesis, Adult Neurogenesis (Dentate Gyrus), Cortical Remapping.',
      principles: '1. Input Specificity: LTP is induced only at synapses that receive high-frequency activation.\n2. Cooperativity: Simultaneous weak stimulation of multiple converging inputs can trigger LTP.\n3. Associativity: A weak input paired simultaneously with a strong input undergoes potentiation.',
      classification: 'Neuropsychology • Cellular Neuroscience • Biological Bases of Behavior',
      models: 'Biophysical Model of Post-Synaptic Dendritic Spine Remodeling; Kandel Aplysia Molecular Cascades (cAMP, PKA, CREB gene transcription).',
      applications: 'Post-stroke motor rehabilitation (Constraint-Induced Movement Therapy), cognitive behavioral therapy neuroimaging changes, treatment of amblyopia and phantom limb pain.',
      clinicalRelevance: 'Impaired synaptic plasticity and pathological LTP loss are hallmarks of Alzheimer\'s disease (beta-amyloid neurotoxicity), major depression (BDNF reduction), and addiction.',
      researchEvidence: 'Eric Kandel received the 2000 Nobel Prize in Physiology or Medicine for detailing the molecular cascades converting short-term synaptic facilitation into long-term protein-synthesis-dependent memory in Aplysia and mice.',
      examples: 'Hippocampal structural enlargement in London taxi drivers acquiring complex spatial knowledge ("The Knowledge") demonstrated by Eleanor Maguire using structural MRI.',
      limitations: 'Neuroplasticity can also be maladaptive, such as in chronic central neuropathic pain, phantom limb syndrome, focal hand dystonia, and substance addiction circuits.',
      referencesCitations: 'Bliss, T. V., & Lømo, T. (1973). Long-lasting potentiation of synaptic transmission in the dentate area of the anaesthetized rabbit following stimulation of the perforant path. The Journal of Physiology, 232(2), 331-356. https://doi.org/10.1113/jphysiol.1973.sp010273\nKandel, E. R. (2001). The molecular biology of memory storage: A dialogue between genes and synapses. Science, 294(5544), 1030-1038.',
      recommendedReading: 'Kandel, E. R., Koester, J. D., Mack, S. H., & Siegelbaum, S. A. (2021). Principles of Neural Science (6th ed.). McGraw-Hill.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['Long-Term Potentiation', 'NMDA Receptor', 'AMPA Receptor', 'Hebbian Learning', 'Cortical Reorganization'],
      theories: 'Hebb Synaptic Plasticity; Bliss & Lømo (1973) LTP Discovery; Kandel Molecular Memory Model.',
      authorReferences: 'Bliss, T. V., & Lømo, T. (1973). The Journal of Physiology, 232(2), 331-356.',
      sourceReferences: 'The Journal of Physiology, 232(2), 331-356.',
      doi: '10.1113/jphysiol.1973.sp010273',
      publicationInfo: 'The Journal of Physiology, 232(2), 331-356'
    },
    {
      title: 'Cognitive Dissonance Theory: Aversive Arousal and Belief Rectification',
      slug: 'cognitive-dissonance-theory',
      categoryId: categoryMap['SOC'],
      definition: 'Cognitive Dissonance Theory posits that holding two or more psychologically contradictory cognitions (beliefs, attitudes, or knowledge of one\'s behavior) generates a state of aversive physiological tension (dissonance) that motivates individuals to alter cognitions or behaviors to restore consonance.',
      explanation: 'Introduced by Leon Festinger in 1957, the theory overturned behaviorist reinforcement models by demonstrating that people paid less money ($1 vs. $20) to tell an uninteresting task was enjoyable subsequently reported significantly higher genuine task liking due to insufficient external justification.',
      introduction: 'Cognitive Dissonance is one of the most influential and widely verified social psychological theories. It demonstrates that behavior frequently shapes attitude and belief systems, rather than attitudes solely directing behavior.',
      historicalBackground: 'Festinger, Riecken, and Schachter (1956) infiltrated a UFO doomsday cult predicting the world\'s destruction on December 21. When the prophecy failed, cult members did not disband; instead, they adopted the belief that their devotion had saved humanity, rationalizing their deep behavioral commitment.',
      keyTheorists: ['Leon Festinger', 'J. Merrill Carlsmith', 'Elliot Aronson', 'Jack Brehm'],
      majorTheories: '1. Festinger\'s Classical Dissonance Theory\n2. Aronson\'s Self-Consistency Theory (Dissonance arises when behavior threatens moral/competent self-concept)\n3. Steele\'s Self-Affirmation Theory\n4. Cooper & Fazio New Look Model (Aversive consequences and personal responsibility).',
      coreConcepts: 'Cognitive Dissonance, Consonant Cognitions, Dissonant Cognitions, Insufficient Justification Paradigm, Post-Decisional Spreading of Alternatives, Effort Justification Paradigm, Induced Compliance, Hypocrisy Paradigm.',
      principles: '1. Magnitude of Dissonance: Proportional to the importance and proportion of dissonant elements.\n2. Motivation to Reduce: Aversive arousal creates drive properties analogous to physiological hunger or pain.\n3. Resistance to Change: Cognitions tied to physical reality or deep self-worth resist alteration.',
      classification: 'Social Psychology • Social Cognition • Attitude Change & Persuasion',
      models: 'Festinger Drive-Reduction Model; Cooper & Fazio 4-Step Dissonance Process Model.',
      applications: 'Public health campaigns (hypocrisy inductions to increase condom use and safe driving), consumer decision-making and post-purchase reassurance, political polarization.',
      clinicalRelevance: 'Directly applicable in Motivational Interviewing: therapists gently highlight dissonance between a client\'s deeply held personal values and addictive behaviors to cultivate internal readiness for change.',
      researchEvidence: 'Physiological recordings confirm heightened skin conductance response (SCR) and anterior cingulate cortex (ACC) activation during induced compliance tasks, which dissipates once attitude alignment occurs.',
      examples: 'Festinger & Carlsmith (1959): Participants paid $1 had insufficient external justification for lying, creating dissonance resolved by convincing themselves the peg-turning task was truly fascinating.',
      limitations: 'Alternative accounts (e.g., Bem\'s Self-Perception Theory) argue that people simply infer their attitudes by observing their own actions without experiencing aversive visceral arousal.',
      referencesCitations: 'Festinger, L. (1957). A Theory of Cognitive Dissonance. Stanford University Press.\nFestinger, L., & Carlsmith, J. M. (1959). Cognitive consequences of forced compliance. The Journal of Abnormal and Social Psychology, 58(2), 203-210. https://doi.org/10.1037/h0041593',
      recommendedReading: 'Cooper, J. (2007). Cognitive Dissonance: 50 Years of a Classic Theory. SAGE Publications.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['Cognitive Dissonance', 'Insufficient Justification', 'Effort Justification', 'Post-Decision Spreading', 'Induced Compliance'],
      theories: 'Festinger (1957) Dissonance Theory; Aronson Self-Consistency Model.',
      authorReferences: 'Festinger, L. (1957). A Theory of Cognitive Dissonance. Stanford University Press.',
      sourceReferences: 'Stanford University Press Classic.',
      doi: '10.1037/h0041593',
      publicationInfo: 'Stanford University Press, Stanford'
    },
    {
      title: 'Dual-Process Theory of Cognition: Heuristic Fast Thinking and Deliberative Analytic Logic',
      slug: 'dual-process-cognition',
      categoryId: categoryMap['COG'],
      definition: 'Dual-Process Theory posits that human judgment, reasoning, and decision-making arise from the interaction of two distinct modes of cognitive processing: System 1 (fast, autonomous, intuitive, emotionally charged, implicit) and System 2 (slow, deliberative, rule-governed, cognitively demanding, reflective).',
      explanation: 'Popularized by Daniel Kahneman and Amos Tversky and formulated across cognitive science by Jonathan Evans and Keith Stanovich, the dual-process architecture explains why humans systematically deviate from normative logic and expected utility via cognitive heuristics and biases.',
      introduction: 'From navigating traffic to evaluating medical prognoses, human cognition balances speed against accuracy. Dual-process theories resolve the paradox of how human minds achieve remarkable real-time adaptive efficiency while remaining prone to predictable, irrational cognitive traps.',
      historicalBackground: 'William James (1890) distinguished between associative thought and true reasoning. In the 1970s and 1980s, Kahneman & Tversky documented cognitive heuristics (representativeness, availability, anchoring). Evans (1984) and Sloman (1996) formalized dual-system computational models.',
      keyTheorists: ['Daniel Kahneman', 'Amos Tversky', 'Jonathan St. B. T. Evans', 'Keith E. Stanovich'],
      majorTheories: '1. Heuristics and Biases Program (Kahneman & Tversky)\n2. Default-Interventionist Architecture (Evans & Stanovich: System 1 generates default intuitions; System 2 decides whether to intervene)\n3. Prospect Theory (Kahneman & Tversky).',
      coreConcepts: 'System 1 (Type 1), System 2 (Type 2), Heuristics, Cognitive Biases, Cognitive Miser, Working Memory Dependence, Decoupling, Cognitive Reflection Test (CRT), Framing Effects.',
      principles: '1. Autonomous Execution: System 1 processes trigger automatically without conscious intent or heavy working memory load.\n2. Resource Competition: System 2 is constrained by finite working memory and easily disrupted by concurrent cognitive load.\n3. Default-Interventionism: Intuitive responses are generated first; deliberate override requires both cognitive capacity and epistemic motivation.',
      classification: 'Cognitive Psychology • Decision Science • Behavioral Economics',
      models: 'Evans & Stanovich Default-Interventionist Processing Diagram; Kahneman System 1/2 Behavioral Decision Architecture.',
      applications: 'Behavioral economics and "Nudge" policy architecture (Thaler & Sunstein), medical diagnostic decision-making to prevent premature diagnostic closure, forensic investigative interviewing.',
      clinicalRelevance: 'Cognitive distortions in depression and anxiety reflect unmoderated System 1 catastrophic interpretations; CBT interventions train patients to deploy deliberate System 2 reality-testing.',
      researchEvidence: 'Demonstrated through fMRI studies showing that overcoming intuitive biases (e.g., in the bat-and-ball problem) requires heightened right lateral prefrontal cortex activation to inhibit default responses.',
      examples: 'Cognitive Reflection Test: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?" System 1 automatically suggests 10¢; System 2 computation reveals 5¢.',
      limitations: 'Critics (e.g., Gigerenzer) argue the distinction is overly binary and that heuristics often reflect ecologically rational adaptations rather than cognitive flaws.',
      referencesCitations: 'Kahneman, D. (2011). Thinking, Fast and Slow. Farrar, Straus and Giroux.\nEvans, J. S. B., & Stanovich, K. E. (2013). Dual-process theories of higher cognition: Advancing the debate. Perspectives on Psychological Science, 8(3), 223-241. https://doi.org/10.1177/1745691612460685',
      recommendedReading: 'Stanovich, K. E. (2011). Rationality and the Reflective Mind. Oxford University Press.',
      verifiedStatus: 'Verified Scholarly',
      keyConcepts: ['System 1', 'System 2', 'Heuristics and Biases', 'Cognitive Reflection Test', 'Default-Interventionism'],
      theories: 'Kahneman & Tversky Prospect Theory; Evans & Stanovich Dual-Process Architecture.',
      authorReferences: 'Kahneman, D. (2011). Thinking, Fast and Slow. Farrar, Straus and Giroux.',
      sourceReferences: 'Farrar, Straus and Giroux.',
      doi: '10.1177/1745691612460685',
      publicationInfo: 'Farrar, Straus and Giroux, New York'
    }
  ];

  for (const art of richArticles) {
    const existing = await prisma.knowledgeArticle.findUnique({ where: { slug: art.slug } });
    if (!existing) {
      await prisma.knowledgeArticle.create({ data: art });
    } else {
      await prisma.knowledgeArticle.update({ where: { id: existing.id }, data: art });
    }
  }
  console.log(`Seeded and synchronized ${richArticles.length} 17-section structured psychology articles.`);

  // 4. Topic Relationship Graph Edges
  const relationsData = [
    { source_topic: 'Working Memory Architecture: Multi-Component Modal Systems', target_topic: 'Dual-Process Theory of Cognition: Heuristic Fast Thinking and Deliberative Analytic Logic', relation_type: 'cognitive_substrate', description: 'System 2 deliberative reasoning is strictly constrained by Working Memory executive capacity.' },
    { source_topic: 'Working Memory Architecture: Multi-Component Modal Systems', target_topic: 'Neuroplasticity, Synaptic Transmission, and Long-Term Potentiation', relation_type: 'biological_mechanism', description: 'Prefrontal and hippocampal synaptic plasticity supports active working memory maintenance.' },
    { source_topic: 'Cognitive Behavioral Model: Schemas, Automatic Thoughts, and Cognitive Distortions', target_topic: 'Biopsychosocial Model: Systemic Etiology and Health Psychology', relation_type: 'clinical_framework', description: 'CBT cognitive formulations integrate directly into the psychological dimension of the Biopsychosocial paradigm.' },
    { source_topic: 'Cognitive Behavioral Model: Schemas, Automatic Thoughts, and Cognitive Distortions', target_topic: 'Cognitive Dissonance Theory: Aversive Arousal and Belief Rectification', relation_type: 'theoretical_parallel', description: 'Challenging core beliefs generates cognitive dissonance, leveraged during behavioral experiments.' },
    { source_topic: 'Signal Detection Theory: Sensitivity, Response Bias, and Psychophysical Decision Making', target_topic: 'Classical Test Theory, True Score Variance, and Reliability Estimation', relation_type: 'measurement_foundation', description: 'Both psychometric paradigms formalize measurement precision and separate signal/true-score from noise/error.' },
    { source_topic: 'The Five-Factor Model of Personality: Trait Taxonomy and Psychometric Structure', target_topic: 'Classical Test Theory, True Score Variance, and Reliability Estimation', relation_type: 'instrument_validation', description: 'The NEO PI-R and Big Five inventories are constructed and validated using Classical Test Theory reliability metrics.' },
    { source_topic: 'Attachment Theory: Internal Working Models and Ethological Development', target_topic: 'Biopsychosocial Model: Systemic Etiology and Health Psychology', relation_type: 'developmental_etiology', description: 'Insecure attachment elevates allostatic load and physiological stress reactivity across the lifespan.' },
    { source_topic: 'Dual-Process Theory of Cognition: Heuristic Fast Thinking and Deliberative Analytic Logic', target_topic: 'Cognitive Dissonance Theory: Aversive Arousal and Belief Rectification', relation_type: 'rationalization_mechanism', description: 'System 1 automatically generates defensive rationalizations to alleviate dissonance without System 2 deliberation.' }
  ];

  for (const rel of relationsData) {
    const existing = await prisma.topicRelation.findMany({
      where: { source_topic: rel.source_topic, target_topic: rel.target_topic }
    });
    if (existing.length === 0) {
      await prisma.topicRelation.create({ data: rel });
    }
  }
  console.log(`Seeded ${relationsData.length} topic relationship graph edges.`);

  // 5. Curated Academic Resources & Classical Literature (Manuals, Textbooks, Landmark Papers)
  const resourcesData = [
    {
      title: 'Diagnostic and Statistical Manual of Mental Disorders, Fifth Edition, Text Revision (DSM-5-TR)',
      author_names: 'American Psychiatric Association',
      publication_year: 2022,
      publisher: 'American Psychiatric Association Publishing',
      doi: '10.1176/appi.books.9780890425787',
      url: 'https://doi.org/10.1176/appi.books.9780890425787',
      abstract: 'The standard diagnostic taxonomic reference for psychiatric and psychological disorders used by clinicians and researchers worldwide. Contains operationalized diagnostic criteria, prevalence rates, cultural features, and differential diagnosis guidelines.',
      publication_type: 'Manual',
      is_verified: true,
      subject: 'Clinical Psychology & Psychiatry',
      copyright_status: 'Authorized Citation & Clinical Reference',
      category_id: categoryMap['CLN']
    },
    {
      title: 'ICD-11: Clinical Descriptions and Diagnostic Requirements for Mental, Behavioural or Neurodevelopmental Disorders',
      author_names: 'World Health Organization',
      publication_year: 2024,
      publisher: 'World Health Organization',
      url: 'https://icd.who.int/browse/2024-01/mms/en',
      abstract: 'Global diagnostic standard for mental disorders developed by the WHO, providing clinical descriptions, developmental boundaries, and diagnostic requirements designed for worldwide clinical utility and cultural applicability.',
      publication_type: 'Manual',
      is_verified: true,
      subject: 'Clinical Psychology & Global Health',
      copyright_status: 'Open WHO Official Standard',
      category_id: categoryMap['CLN']
    },
    {
      title: 'Principles of Neural Science, Sixth Edition',
      author_names: 'Eric R. Kandel; John D. Koester; Sarah H. Mack; Steven A. Siegelbaum',
      publication_year: 2021,
      publisher: 'McGraw-Hill Medical',
      doi: '10.1036/0071390111',
      abstract: 'The definitive textbook of cognitive and cellular neuroscience. Covers cellular and molecular biology of neurons, synaptic transmission, sensory processing, cognitive neural systems, and the neurological basis of psychiatric disorders.',
      publication_type: 'Textbook',
      is_verified: true,
      subject: 'Neuropsychology & Cognitive Neuroscience',
      copyright_status: 'Standard Academic Reference',
      category_id: categoryMap['NEU']
    },
    {
      title: 'Cognitive Therapy of Depression',
      author_names: 'Aaron T. Beck; A. John Rush; Brian F. Shaw; Gary Emery',
      publication_year: 1979,
      publisher: 'Guilford Press',
      abstract: 'The landmark clinical manual establishing the cognitive therapy formulation, automatic thought records, behavioral activation, and schema restructuring protocols for depressive disorders.',
      publication_type: 'Book',
      is_verified: true,
      subject: 'Clinical Psychology & Psychotherapy',
      copyright_status: 'Seminal Clinical Monograph',
      category_id: categoryMap['CLN']
    },
    {
      title: 'Psychological Testing and Assessment: An Introduction to Tests and Measurement (9th Edition)',
      author_names: 'Ronald Jay Cohen; Mark E. Swerdlik',
      publication_year: 2018,
      publisher: 'McGraw-Hill Education',
      abstract: 'Comprehensive authoritative textbook covering psychometric theory, classical test theory, item response theory, test construction, reliability estimation, validity assessment, and psychological evaluation in clinical and forensic settings.',
      publication_type: 'Textbook',
      is_verified: true,
      subject: 'Psychometrics & Psychological Assessment',
      copyright_status: 'Standard University Textbook',
      category_id: categoryMap['PSY']
    },
    {
      title: 'Neuropsychological Assessment (5th Edition)',
      author_names: 'Muriel D. Lezak; Diane B. Howieson; Erin D. Bigler; Daniel Tranel',
      publication_year: 2012,
      publisher: 'Oxford University Press',
      abstract: 'The gold-standard reference work in clinical neuropsychology detailing test batteries for executive functioning, memory, language, visuospatial abilities, and traumatic brain injury evaluation.',
      publication_type: 'Textbook',
      is_verified: true,
      subject: 'Neuropsychological Assessment',
      copyright_status: 'Classical Clinical Reference',
      category_id: categoryMap['ASM']
    },
    {
      title: 'The Magical Number Seven, Plus or Minus Two: Some Limits on Our Capacity for Processing Information',
      author_names: 'George A. Miller',
      publication_year: 1956,
      publisher: 'Psychological Review',
      journal: 'Psychological Review',
      volume: '63',
      issue: '2',
      pages: '81-97',
      doi: '10.1037/h0043158',
      abstract: 'One of the most cited papers in cognitive psychology, demonstrating that immediate memory span and absolute judgment capacity are constrained to approximately seven chunks of information.',
      publication_type: 'Journal Article',
      is_verified: true,
      subject: 'Cognitive Psychology',
      copyright_status: 'Public Scholarly Archive',
      category_id: categoryMap['COG']
    },
    {
      title: 'Working Memory: Looking Back and Looking Forward',
      author_names: 'Alan Baddeley',
      publication_year: 2003,
      publisher: 'Nature Publishing Group',
      journal: 'Nature Reviews Neuroscience',
      volume: '4',
      issue: '10',
      pages: '829-839',
      doi: '10.1038/nrn1201',
      abstract: 'A comprehensive retrospective synthesis of the multi-component working memory model, detailing neuroimaging validation and the role of the episodic buffer in conscious binding.',
      publication_type: 'Journal Article',
      is_verified: true,
      subject: 'Cognitive Neuroscience',
      copyright_status: 'Scholarly Review',
      category_id: categoryMap['COG']
    },
    {
      title: 'Attachment and Loss: Volume 1. Attachment',
      author_names: 'John Bowlby',
      publication_year: 1969,
      publisher: 'Basic Books',
      abstract: 'The foundational foundational text articulating how evolutionary biology, ethology, and psychodynamic principles combine to explain maternal-infant attachment behaviors and subsequent psychological organization.',
      publication_type: 'Book',
      is_verified: true,
      subject: 'Developmental Psychology',
      copyright_status: 'Seminal Academic Monograph',
      category_id: categoryMap['DEV']
    },
    {
      title: 'Judgment under Uncertainty: Heuristics and Biases',
      author_names: 'Amos Tversky; Daniel Kahneman',
      publication_year: 1974,
      publisher: 'American Association for the Advancement of Science',
      journal: 'Science',
      volume: '185',
      issue: '4157',
      pages: '1124-1131',
      doi: '10.1126/science.185.4157.1124',
      abstract: 'Seminal paper detailing how people rely on a limited number of heuristic principles (representativeness, availability, anchoring) that reduce the complex tasks of assessing probabilities to simpler judgmental operations.',
      publication_type: 'Journal Article',
      is_verified: true,
      subject: 'Decision Science & Social Cognition',
      copyright_status: 'Landmark Scientific Paper',
      category_id: categoryMap['COG']
    },
    {
      title: 'Publication Manual of the American Psychological Association (7th Edition)',
      author_names: 'American Psychological Association',
      publication_year: 2020,
      publisher: 'American Psychological Association',
      doi: '10.1037/0000165-000',
      url: 'https://apastyle.apa.org',
      abstract: 'The official guide to APA Style. Provides comprehensive rules for scientific writing, manuscript structure, bias-free language, ethics in reporting, and precise citation formatting.',
      publication_type: 'Manual',
      is_verified: true,
      subject: 'Research Methods & Scholarly Writing',
      copyright_status: 'Official APA Standard Guide',
      category_id: categoryMap['RES']
    },
    {
      title: 'A Theory of Cognitive Dissonance',
      author_names: 'Leon Festinger',
      publication_year: 1957,
      publisher: 'Stanford University Press',
      abstract: 'The classic treatise proposing that inconsistencies among cognitions generate motivational dissonance states driving attitude change, information seeking, and post-decisional regret resolution.',
      publication_type: 'Book',
      is_verified: true,
      subject: 'Social Psychology',
      copyright_status: 'Classic Academic Monograph',
      category_id: categoryMap['SOC']
    }
  ];

  for (const res of resourcesData) {
    const existing = await prisma.reference.findMany({ where: { title: res.title } });
    if (existing.length === 0) {
      await prisma.reference.create({ data: res });
    }
  }
  console.log(`Seeded ${resourcesData.length} curated verified scholarly resources into Digital Library.`);

  // 6. Sample Bookmarks
  const sampleBookmarks = [
    {
      item_type: 'article',
      item_id: 'working-memory-architecture',
      title: 'Working Memory Architecture (Baddeley & Hitch)',
      notes: 'Key foundational theory for UGC NET Exam Paper 2 Unit 3 (Cognitive Processes).',
      category: 'Cognitive Psychology'
    },
    {
      item_type: 'resource',
      item_id: 'dsm-5-tr',
      title: 'DSM-5-TR Manual Reference',
      notes: 'Clinical criteria reference for differential diagnosis formulation.',
      category: 'Clinical Psychology'
    }
  ];

  for (const bm of sampleBookmarks) {
    const existing = await prisma.bookmark.findMany({ where: { item_id: bm.item_id } });
    if (existing.length === 0) {
      await prisma.bookmark.create({ data: bm });
    }
  }
  console.log(`Seeded ${sampleBookmarks.length} scholarly study bookmarks.`);

  console.log('Phase 3 Database Seeding successfully completed!');
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('seed')) {
  seedDatabase().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
