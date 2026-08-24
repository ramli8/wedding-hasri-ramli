package invitation

import (
	"context"
	"errors"

	"github.com/base-go/backend/internal/shared/models"
	"github.com/base-go/backend/pkg/database"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrWeddingNotFound        = errors.New("wedding not found")
	ErrCoupleNotFound         = errors.New("wedding couple not found")
	ErrCoupleAlreadyExists    = errors.New("wedding couple side already exists")
	ErrEventNotFound          = errors.New("wedding event not found")
	ErrStoryNotFound          = errors.New("story event not found")
	ErrGalleryItemNotFound    = errors.New("gallery item not found")
	ErrFaqNotFound            = errors.New("faq not found")
	ErrBankAccountNotFound    = errors.New("bank account not found")
	ErrEwalletNotFound        = errors.New("ewallet not found")
	ErrWishlistItemNotFound   = errors.New("wishlist item not found")
	ErrSectionNotFound        = errors.New("invitation section not found")
	ErrSectionAlreadyExists   = errors.New("invitation section already exists")
	ErrGuestNotFound          = errors.New("guest not found")
)

type Repository interface {
	GetWedding(ctx context.Context) (*models.Wedding, error)
	UpdateWedding(ctx context.Context, wedding *models.Wedding) error
	UpsertWedding(ctx context.Context, wedding *models.Wedding) error

	CreateCouple(ctx context.Context, couple *models.WeddingCouple) error
	GetCoupleByID(ctx context.Context, id string) (*models.WeddingCouple, error)
	ListCouples(ctx context.Context) ([]models.WeddingCouple, error)
	UpdateCouple(ctx context.Context, couple *models.WeddingCouple) error
	DeleteCouple(ctx context.Context, id string) error

	CreateEvent(ctx context.Context, event *models.WeddingEvent) error
	GetEventByID(ctx context.Context, id string) (*models.WeddingEvent, error)
	ListEvents(ctx context.Context) ([]models.WeddingEvent, error)
	UpdateEvent(ctx context.Context, event *models.WeddingEvent) error
	DeleteEvent(ctx context.Context, id string) error
	ClearMainEvent(ctx context.Context, excludeID string) error

	CreateStory(ctx context.Context, story *models.WeddingStoryEvent) error
	GetStoryByID(ctx context.Context, id string) (*models.WeddingStoryEvent, error)
	ListStories(ctx context.Context) ([]models.WeddingStoryEvent, error)
	UpdateStory(ctx context.Context, story *models.WeddingStoryEvent) error
	DeleteStory(ctx context.Context, id string) error

	CreateGalleryItem(ctx context.Context, item *models.WeddingGalleryItem) error
	GetGalleryItemByID(ctx context.Context, id string) (*models.WeddingGalleryItem, error)
	ListGalleryItems(ctx context.Context) ([]models.WeddingGalleryItem, error)
	UpdateGalleryItem(ctx context.Context, item *models.WeddingGalleryItem) error
	DeleteGalleryItem(ctx context.Context, id string) error

	CreateFaq(ctx context.Context, faq *models.WeddingFaq) error
	GetFaqByID(ctx context.Context, id string) (*models.WeddingFaq, error)
	ListFaqs(ctx context.Context) ([]models.WeddingFaq, error)
	UpdateFaq(ctx context.Context, faq *models.WeddingFaq) error
	DeleteFaq(ctx context.Context, id string) error

	CreateBankAccount(ctx context.Context, account *models.WeddingBankAccount) error
	GetBankAccountByID(ctx context.Context, id string) (*models.WeddingBankAccount, error)
	ListBankAccounts(ctx context.Context) ([]models.WeddingBankAccount, error)
	UpdateBankAccount(ctx context.Context, account *models.WeddingBankAccount) error
	DeleteBankAccount(ctx context.Context, id string) error

	CreateEwallet(ctx context.Context, ewallet *models.WeddingEwallet) error
	GetEwalletByID(ctx context.Context, id string) (*models.WeddingEwallet, error)
	ListEwallets(ctx context.Context) ([]models.WeddingEwallet, error)
	UpdateEwallet(ctx context.Context, ewallet *models.WeddingEwallet) error
	DeleteEwallet(ctx context.Context, id string) error

	CreateWishlistItem(ctx context.Context, item *models.WeddingWishlistItem) error
	GetWishlistItemByID(ctx context.Context, id string) (*models.WeddingWishlistItem, error)
	ListWishlistItems(ctx context.Context) ([]models.WeddingWishlistItem, error)
	UpdateWishlistItem(ctx context.Context, item *models.WeddingWishlistItem) error
	DeleteWishlistItem(ctx context.Context, id string) error

	CreateSection(ctx context.Context, section *models.InvitationSection) error
	GetSectionByID(ctx context.Context, id string) (*models.InvitationSection, error)
	ListSections(ctx context.Context) ([]models.InvitationSection, error)
	UpdateSection(ctx context.Context, section *models.InvitationSection) error
	DeleteSection(ctx context.Context, id string) error

	GetGuestByUUID(ctx context.Context, id string) (*models.Guest, error)
	MarkInvitationOpened(ctx context.Context, guestID string) error

	GetRSVPByGuestAndEvent(ctx context.Context, guestID string, weddingEventID *string) (*models.RSVPSubmission, error)
	CreateRSVP(ctx context.Context, submission *models.RSVPSubmission) error
	UpdateRSVP(ctx context.Context, submission *models.RSVPSubmission) error
	UpdateGuestAttendance(ctx context.Context, guestID string, status string) error

	ListGuestbook(ctx context.Context, limit int, offset int) ([]models.GuestbookEntry, error)
	CountGuestbook(ctx context.Context) (int64, error)
	CreateGuestbookEntry(ctx context.Context, entry *models.GuestbookEntry) error
}

type repository struct {
	db database.Database
}

func NewRepository(db database.Database) Repository {
	return &repository{db: db}
}

func (r *repository) GetWedding(ctx context.Context) (*models.Wedding, error) {
	var wedding models.Wedding
	err := r.db.GetDB().WithContext(ctx).First(&wedding).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWeddingNotFound
		}
		return nil, err
	}
	return &wedding, nil
}

func (r *repository) UpdateWedding(ctx context.Context, wedding *models.Wedding) error {
	return r.db.GetDB().WithContext(ctx).Save(wedding).Error
}

func (r *repository) UpsertWedding(ctx context.Context, wedding *models.Wedding) error {
	return r.db.GetDB().WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"groom_name", "bride_name", "wedding_date", "content", "gift_shipping_address", "updated_at"}),
	}).Create(wedding).Error
}

func (r *repository) CreateCouple(ctx context.Context, couple *models.WeddingCouple) error {
	var existing models.WeddingCouple
	if err := r.db.GetDB().Where("side = ?", couple.Side).First(&existing).Error; err == nil {
		return ErrCoupleAlreadyExists
	}
	return r.db.GetDB().WithContext(ctx).Create(couple).Error
}

func (r *repository) GetCoupleByID(ctx context.Context, id string) (*models.WeddingCouple, error) {
	var couple models.WeddingCouple
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&couple).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCoupleNotFound
		}
		return nil, err
	}
	return &couple, nil
}

func (r *repository) ListCouples(ctx context.Context) ([]models.WeddingCouple, error) {
	var couples []models.WeddingCouple
	err := r.db.GetDB().WithContext(ctx).Order("created_at asc").Find(&couples).Error
	return couples, err
}

func (r *repository) UpdateCouple(ctx context.Context, couple *models.WeddingCouple) error {
	return r.db.GetDB().WithContext(ctx).Save(couple).Error
}

func (r *repository) DeleteCouple(ctx context.Context, id string) error {
	result := r.db.GetDB().WithContext(ctx).Delete(&models.WeddingCouple{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrCoupleNotFound
	}
	return nil
}

func (r *repository) CreateEvent(ctx context.Context, event *models.WeddingEvent) error {
	return r.db.GetDB().WithContext(ctx).Create(event).Error
}

func (r *repository) GetEventByID(ctx context.Context, id string) (*models.WeddingEvent, error) {
	var event models.WeddingEvent
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&event).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrEventNotFound
		}
		return nil, err
	}
	return &event, nil
}

func (r *repository) ListEvents(ctx context.Context) ([]models.WeddingEvent, error) {
	var events []models.WeddingEvent
	err := r.db.GetDB().WithContext(ctx).Order("order_index asc, created_at asc").Find(&events).Error
	return events, err
}

func (r *repository) UpdateEvent(ctx context.Context, event *models.WeddingEvent) error {
	return r.db.GetDB().WithContext(ctx).Save(event).Error
}

func (r *repository) DeleteEvent(ctx context.Context, id string) error {
	result := r.db.GetDB().WithContext(ctx).Delete(&models.WeddingEvent{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrEventNotFound
	}
	return nil
}

func (r *repository) ClearMainEvent(ctx context.Context, excludeID string) error {
	return r.db.GetDB().WithContext(ctx).
		Model(&models.WeddingEvent{}).
		Where("id <> ? AND is_main_event = true", excludeID).
		Update("is_main_event", false).Error
}

func (r *repository) CreateStory(ctx context.Context, story *models.WeddingStoryEvent) error {
	return r.db.GetDB().WithContext(ctx).Create(story).Error
}

func (r *repository) GetStoryByID(ctx context.Context, id string) (*models.WeddingStoryEvent, error) {
	var story models.WeddingStoryEvent
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&story).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrStoryNotFound
		}
		return nil, err
	}
	return &story, nil
}

func (r *repository) ListStories(ctx context.Context) ([]models.WeddingStoryEvent, error) {
	var stories []models.WeddingStoryEvent
	err := r.db.GetDB().WithContext(ctx).Order("order_index asc, created_at asc").Find(&stories).Error
	return stories, err
}

func (r *repository) UpdateStory(ctx context.Context, story *models.WeddingStoryEvent) error {
	return r.db.GetDB().WithContext(ctx).Save(story).Error
}

func (r *repository) DeleteStory(ctx context.Context, id string) error {
	result := r.db.GetDB().WithContext(ctx).Delete(&models.WeddingStoryEvent{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrStoryNotFound
	}
	return nil
}

func (r *repository) CreateGalleryItem(ctx context.Context, item *models.WeddingGalleryItem) error {
	return r.db.GetDB().WithContext(ctx).Create(item).Error
}

func (r *repository) GetGalleryItemByID(ctx context.Context, id string) (*models.WeddingGalleryItem, error) {
	var item models.WeddingGalleryItem
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&item).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGalleryItemNotFound
		}
		return nil, err
	}
	return &item, nil
}

func (r *repository) ListGalleryItems(ctx context.Context) ([]models.WeddingGalleryItem, error) {
	var items []models.WeddingGalleryItem
	err := r.db.GetDB().WithContext(ctx).Order("order_index asc, created_at asc").Find(&items).Error
	return items, err
}

func (r *repository) UpdateGalleryItem(ctx context.Context, item *models.WeddingGalleryItem) error {
	return r.db.GetDB().WithContext(ctx).Save(item).Error
}

func (r *repository) DeleteGalleryItem(ctx context.Context, id string) error {
	result := r.db.GetDB().WithContext(ctx).Delete(&models.WeddingGalleryItem{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrGalleryItemNotFound
	}
	return nil
}

func (r *repository) CreateFaq(ctx context.Context, faq *models.WeddingFaq) error {
	return r.db.GetDB().WithContext(ctx).Create(faq).Error
}

func (r *repository) GetFaqByID(ctx context.Context, id string) (*models.WeddingFaq, error) {
	var faq models.WeddingFaq
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&faq).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFaqNotFound
		}
		return nil, err
	}
	return &faq, nil
}

func (r *repository) ListFaqs(ctx context.Context) ([]models.WeddingFaq, error) {
	var faqs []models.WeddingFaq
	err := r.db.GetDB().WithContext(ctx).Order("order_index asc, created_at asc").Find(&faqs).Error
	return faqs, err
}

func (r *repository) UpdateFaq(ctx context.Context, faq *models.WeddingFaq) error {
	return r.db.GetDB().WithContext(ctx).Save(faq).Error
}

func (r *repository) DeleteFaq(ctx context.Context, id string) error {
	result := r.db.GetDB().WithContext(ctx).Delete(&models.WeddingFaq{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrFaqNotFound
	}
	return nil
}

func (r *repository) CreateBankAccount(ctx context.Context, account *models.WeddingBankAccount) error {
	return r.db.GetDB().WithContext(ctx).Create(account).Error
}

func (r *repository) GetBankAccountByID(ctx context.Context, id string) (*models.WeddingBankAccount, error) {
	var account models.WeddingBankAccount
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&account).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBankAccountNotFound
		}
		return nil, err
	}
	return &account, nil
}

func (r *repository) ListBankAccounts(ctx context.Context) ([]models.WeddingBankAccount, error) {
	var accounts []models.WeddingBankAccount
	err := r.db.GetDB().WithContext(ctx).Order("created_at asc").Find(&accounts).Error
	return accounts, err
}

func (r *repository) UpdateBankAccount(ctx context.Context, account *models.WeddingBankAccount) error {
	return r.db.GetDB().WithContext(ctx).Save(account).Error
}

func (r *repository) DeleteBankAccount(ctx context.Context, id string) error {
	result := r.db.GetDB().WithContext(ctx).Delete(&models.WeddingBankAccount{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrBankAccountNotFound
	}
	return nil
}

func (r *repository) CreateEwallet(ctx context.Context, ewallet *models.WeddingEwallet) error {
	return r.db.GetDB().WithContext(ctx).Create(ewallet).Error
}

func (r *repository) GetEwalletByID(ctx context.Context, id string) (*models.WeddingEwallet, error) {
	var ewallet models.WeddingEwallet
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&ewallet).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrEwalletNotFound
		}
		return nil, err
	}
	return &ewallet, nil
}

func (r *repository) ListEwallets(ctx context.Context) ([]models.WeddingEwallet, error) {
	var ewallets []models.WeddingEwallet
	err := r.db.GetDB().WithContext(ctx).Order("created_at asc").Find(&ewallets).Error
	return ewallets, err
}

func (r *repository) UpdateEwallet(ctx context.Context, ewallet *models.WeddingEwallet) error {
	return r.db.GetDB().WithContext(ctx).Save(ewallet).Error
}

func (r *repository) DeleteEwallet(ctx context.Context, id string) error {
	result := r.db.GetDB().WithContext(ctx).Delete(&models.WeddingEwallet{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrEwalletNotFound
	}
	return nil
}

func (r *repository) CreateWishlistItem(ctx context.Context, item *models.WeddingWishlistItem) error {
	return r.db.GetDB().WithContext(ctx).Create(item).Error
}

func (r *repository) GetWishlistItemByID(ctx context.Context, id string) (*models.WeddingWishlistItem, error) {
	var item models.WeddingWishlistItem
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&item).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWishlistItemNotFound
		}
		return nil, err
	}
	return &item, nil
}

func (r *repository) ListWishlistItems(ctx context.Context) ([]models.WeddingWishlistItem, error) {
	var items []models.WeddingWishlistItem
	err := r.db.GetDB().WithContext(ctx).Order("created_at asc").Find(&items).Error
	return items, err
}

func (r *repository) UpdateWishlistItem(ctx context.Context, item *models.WeddingWishlistItem) error {
	return r.db.GetDB().WithContext(ctx).Save(item).Error
}

func (r *repository) DeleteWishlistItem(ctx context.Context, id string) error {
	result := r.db.GetDB().WithContext(ctx).Delete(&models.WeddingWishlistItem{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrWishlistItemNotFound
	}
	return nil
}

func (r *repository) CreateSection(ctx context.Context, section *models.InvitationSection) error {
	var existing models.InvitationSection
	if err := r.db.GetDB().Where("section_key = ?", section.SectionKey).First(&existing).Error; err == nil {
		return ErrSectionAlreadyExists
	}
	return r.db.GetDB().WithContext(ctx).Create(section).Error
}

func (r *repository) GetSectionByID(ctx context.Context, id string) (*models.InvitationSection, error) {
	var section models.InvitationSection
	err := r.db.GetDB().WithContext(ctx).Where("id = ?", id).First(&section).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSectionNotFound
		}
		return nil, err
	}
	return &section, nil
}

func (r *repository) ListSections(ctx context.Context) ([]models.InvitationSection, error) {
	var sections []models.InvitationSection
	err := r.db.GetDB().WithContext(ctx).Order("order_index asc, created_at asc").Find(&sections).Error
	return sections, err
}

func (r *repository) UpdateSection(ctx context.Context, section *models.InvitationSection) error {
	return r.db.GetDB().WithContext(ctx).Save(section).Error
}

func (r *repository) DeleteSection(ctx context.Context, id string) error {
	result := r.db.GetDB().WithContext(ctx).Delete(&models.InvitationSection{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrSectionNotFound
	}
	return nil
}

func (r *repository) GetGuestByUUID(ctx context.Context, id string) (*models.Guest, error) {
	var guest models.Guest
	err := r.db.GetDB().WithContext(ctx).
		Preload("GuestCategory").
		Where("id = ? AND deleted_at IS NULL", id).
		First(&guest).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &guest, nil
}

func (r *repository) MarkInvitationOpened(ctx context.Context, guestID string) error {
	return r.db.GetDB().WithContext(ctx).
		Model(&models.Guest{}).
		Where("id = ? AND invitation_opened_at IS NULL", guestID).
		Update("invitation_opened_at", gorm.Expr("NOW()")).Error
}

func (r *repository) GetRSVPByGuestAndEvent(ctx context.Context, guestID string, weddingEventID *string) (*models.RSVPSubmission, error) {
	var submission models.RSVPSubmission
	query := r.db.GetDB().WithContext(ctx).Where("guest_id = ?", guestID)
	if weddingEventID == nil {
		query = query.Where("wedding_event_id IS NULL")
	} else {
		query = query.Where("wedding_event_id = ?", *weddingEventID)
	}
	err := query.First(&submission).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &submission, nil
}

func (r *repository) CreateRSVP(ctx context.Context, submission *models.RSVPSubmission) error {
	return r.db.GetDB().WithContext(ctx).Create(submission).Error
}

func (r *repository) UpdateRSVP(ctx context.Context, submission *models.RSVPSubmission) error {
	return r.db.GetDB().WithContext(ctx).Save(submission).Error
}

func (r *repository) UpdateGuestAttendance(ctx context.Context, guestID string, status string) error {
	return r.db.GetDB().WithContext(ctx).
		Model(&models.Guest{}).
		Where("id = ?", guestID).
		Update("status_attending", status).Error
}

func (r *repository) ListGuestbook(ctx context.Context, limit int, offset int) ([]models.GuestbookEntry, error) {
	var entries []models.GuestbookEntry
	err := r.db.GetDB().WithContext(ctx).
		Where("is_hidden = ?", false).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&entries).Error
	return entries, err
}

func (r *repository) CountGuestbook(ctx context.Context) (int64, error) {
	var total int64
	err := r.db.GetDB().WithContext(ctx).
		Model(&models.GuestbookEntry{}).
		Where("is_hidden = ?", false).
		Count(&total).Error
	return total, err
}

func (r *repository) CreateGuestbookEntry(ctx context.Context, entry *models.GuestbookEntry) error {
	return r.db.GetDB().WithContext(ctx).Create(entry).Error
}
