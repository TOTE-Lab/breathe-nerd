/*
    React component - Stress rating popup for before and after
    A panel of 10 numbered buttons 
    When a use clicks one (rates stress) it calls a function with that number

*/


// COMPONENT StressRating(label, onRate):
interface StressRatingProps {
    label: string;
    onRate: (rating: number) => void;
}

export default function StressRating({ label, onRate }: StressRatingProps) {
    return (
        // RENDER a container panel
        <div className="stress-rating-panel">
        {/* RENDER a text element displaying 'label' */}
        <p className="stress-rating-label">{label}</p>
        {/* RENDER a row of buttons */}
        <div className="stress-rating-numbers">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
                key={num}
                type="button"
                className="stress-rating-num"
                onClick={() => onRate(num)}
            >
                {num}
            </button>
            ))}
        </div>
        </div>
    );
}