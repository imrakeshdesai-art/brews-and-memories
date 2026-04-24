import { reviewsData } from '../data/reviewsData';

function Reviews() {
  return (
    <section className="section" id="reviews">
      <div className="section-header">
        <span className="section-label">Customer Love</span>
        <h2 className="section-title">What Our Guests <em>Say</em></h2>
        <div className="section-divider" />
      </div>
      <div className="rating-summary">
        <div className="big-rating">4.2</div>
        <div className="rating-stars-big">★★★★☆</div>
        <div className="rating-meta">Based on 200+ Google Reviews</div>
      </div>
      <div className="reviews-grid">
        {reviewsData.map((review) => (
          <article key={review.name} className="review-card">
            <div className="review-header">
              <div className="avatar">{review.initials}</div>
              <div>
                <strong>{review.name}</strong>
                <div className="footer-note">{review.date}</div>
              </div>
            </div>
            <div className="review-stars">{'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}</div>
            <p className="review-text">{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Reviews;
