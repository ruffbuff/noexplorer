import LetterGlitch from './LetterGlitch';

const LetterG = () => {
    return (
        <LetterGlitch
            glitchColors={["#2b4539", "#61dca3", "#61b3dc"]}
            glitchSpeed={500}
            centerVignette={false}
            outerVignette={true}
            smooth={true}
        />
    );
};

export default LetterG;