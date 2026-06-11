package kondangan

import (
	"context"
	"errors"

	"github.com/base-go/backend/internal/shared/models"
	"github.com/base-go/backend/pkg/database"
	"gorm.io/gorm"
)

var (
	ErrKondanganNotFound = errors.New("kondangan not found")
)

type Repository interface {
	Create(ctx context.Context, kondangan *models.Kondangan) error
	GetByID(ctx context.Context, id string) (*models.Kondangan, error)
	List(ctx context.Context, req KondanganListRequest) ([]models.Kondangan, int64, error)
	Update(ctx context.Context, kondangan *models.Kondangan) error
	Delete(ctx context.Context, id string) error
	GetStats(ctx context.Context) (KondanganStatsResponse, error)

	// Relations
	CreateRelation(ctx context.Context, relation *models.KondanganRelation) error
	DeleteRelation(ctx context.Context, id int) error
	ListRelations(ctx context.Context) ([]models.KondanganRelation, error)
}

type repository struct {
	db database.Database
}

func NewRepository(db database.Database) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, kondangan *models.Kondangan) error {
	return r.db.GetDB().WithContext(ctx).Create(kondangan).Error
}

func (r *repository) GetByID(ctx context.Context, id string) (*models.Kondangan, error) {
	var kondangan models.Kondangan
	err := r.db.GetDB().WithContext(ctx).
		Preload("Relation").
		Where("id = ? AND deleted_at IS NULL", id).
		First(&kondangan).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrKondanganNotFound
		}
		return nil, err
	}
	return &kondangan, nil
}

func (r *repository) List(ctx context.Context, req KondanganListRequest) ([]models.Kondangan, int64, error) {
	var kondangans []models.Kondangan
	var total int64

	query := r.db.GetDB().WithContext(ctx).Model(&models.Kondangan{}).Preload("Relation").Where("deleted_at IS NULL")

	if req.Search != "" {
		query = query.Where("couple_name ILIKE ? OR gift_name ILIKE ?", "%"+req.Search+"%", "%"+req.Search+"%")
	}

	if req.RelationID != 0 {
		query = query.Where("relation_id = ?", req.RelationID)
	}

	if req.Side != "" && req.Side != "all" {
		query = query.Where("side = ?", req.Side)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	sortBy := "created_at"
	if req.SortBy != "" {
		sortBy = req.SortBy
	}
	sortDir := "desc"
	if req.SortDir == "asc" {
		sortDir = "asc"
	}
	query = query.Order(sortBy + " " + sortDir)

	if req.Page > 0 && req.PageSize > 0 {
		offset := (req.Page - 1) * req.PageSize
		query = query.Offset(offset).Limit(req.PageSize)
	}

	if err := query.Find(&kondangans).Error; err != nil {
		return nil, 0, err
	}

	return kondangans, total, nil
}

func (r *repository) Update(ctx context.Context, kondangan *models.Kondangan) error {
	return r.db.GetDB().WithContext(ctx).Save(kondangan).Error
}

func (r *repository) Delete(ctx context.Context, id string) error {
	return r.db.GetDB().WithContext(ctx).
		Model(&models.Kondangan{}).
		Where("id = ?", id).
		Update("deleted_at", gorm.Expr("NOW()")).Error
}

func (r *repository) GetStats(ctx context.Context) (KondanganStatsResponse, error) {
	var stats KondanganStatsResponse
	db := r.db.GetDB().WithContext(ctx).Model(&models.Kondangan{}).Where("deleted_at IS NULL")

	db.Count(&stats.TotalKondangan)
	
	db.Where("gift_type = ?", "Uang").Count(&stats.TotalUang)
	
	db2 := r.db.GetDB().WithContext(ctx).Model(&models.Kondangan{}).Where("deleted_at IS NULL")
	db2.Where("gift_type = ?", "Kado").Count(&stats.TotalKado)

	type SumResult struct {
		TotalPengeluaran float64
		MaxUang float64
		MaxKado float64
	}
	
	var res SumResult
	r.db.GetDB().WithContext(ctx).Model(&models.Kondangan{}).Where("deleted_at IS NULL").
		Select("COALESCE(SUM(nominal), 0) as total_pengeluaran, COALESCE(MAX(CASE WHEN gift_type='Uang' THEN nominal ELSE 0 END), 0) as max_uang, COALESCE(MAX(CASE WHEN gift_type='Kado' THEN nominal ELSE 0 END), 0) as max_kado").
		Scan(&res)
	
	stats.TotalPengeluaran = res.TotalPengeluaran
	stats.MaxUang = res.MaxUang
	stats.MaxKado = res.MaxKado
	
	if stats.TotalKondangan > 0 {
		stats.RataRata = stats.TotalPengeluaran / float64(stats.TotalKondangan)
	}
	
	return stats, nil
}

func (r *repository) CreateRelation(ctx context.Context, relation *models.KondanganRelation) error {
	return r.db.GetDB().WithContext(ctx).Create(relation).Error
}

func (r *repository) DeleteRelation(ctx context.Context, id int) error {
	return r.db.GetDB().WithContext(ctx).Delete(&models.KondanganRelation{}, id).Error
}

func (r *repository) ListRelations(ctx context.Context) ([]models.KondanganRelation, error) {
	var relations []models.KondanganRelation
	err := r.db.GetDB().WithContext(ctx).Order("name ASC").Find(&relations).Error
	return relations, err
}
